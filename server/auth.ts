import session from "express-session";
import type { Express, RequestHandler, Request, Response } from "express";
import connectPg from "connect-pg-simple";
import crypto from "crypto";
import { seatApiService, type CharacterSheetData } from "./services/seatApi";
import { storage } from "./storage";
import type { SessionUserData } from "@shared/models/auth";

const EVE_SSO_AUTH_URL = "https://login.eveonline.com/v2/oauth/authorize";
const EVE_SSO_TOKEN_URL = "https://login.eveonline.com/v2/oauth/token";

interface EveTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}

interface EveCharacterInfo {
  CharacterID: number;
  CharacterName: string;
  ExpiresOn: string;
  Scopes: string;
  TokenType: string;
  CharacterOwnerHash: string;
  IntellectualProperty: string;
}

/** Claims present in an EVE SSO v2 JWT access token. */
interface EveSsoJwtClaims {
  sub: string;                  // "CHARACTER:EVE:<id>"
  name: string;                 // character name
  exp: number;                  // unix seconds
  iss: string;                  // issuer
  scp?: string[] | string;      // granted scopes (array or space-separated string)
  owner?: string;               // character owner hash
}

declare module "express-session" {
  interface SessionData {
    user?: SessionUserData;
    oauthState?: string;
  }
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const isProduction = process.env.NODE_ENV === "production";
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: sessionTtl,
    },
  });
}

async function exchangeCodeForToken(code: string, redirectUri: string): Promise<EveTokenResponse> {
  const clientId = process.env.EVE_CLIENT_ID!;
  const clientSecret = process.env.EVE_CLIENT_SECRET!;
  
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  
  const response = await fetch(EVE_SSO_TOKEN_URL, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "<unreadable>");
    console.error("[auth] Token exchange failed", {
      url: EVE_SSO_TOKEN_URL,
      status: response.status,
      statusText: response.statusText,
      body,
    });
    throw new Error(`Token exchange failed: HTTP ${response.status} ${response.statusText} — ${body}`);
  }

  return response.json();
}

const VALID_EVE_ISSUERS = new Set(["login.eveonline.com", "https://login.eveonline.com"]);

function getCharacterInfo(accessToken: string): EveCharacterInfo {
  // Decode the JWT payload locally — no extra HTTP round-trip required.
  // Signature verification is intentionally skipped; we already received the token
  // via a TLS-secured token exchange with EVE SSO, which is sufficient trust.
  const parts = accessToken.split(".");
  if (parts.length !== 3) {
    throw new Error(`Invalid JWT: expected 3 dot-separated parts, got ${parts.length}`);
  }

  let claims: EveSsoJwtClaims;
  try {
    // Base64url → Base64 → UTF-8 JSON
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(base64, "base64").toString("utf8");
    claims = JSON.parse(json) as EveSsoJwtClaims;
  } catch (err) {
    console.error("[auth] JWT payload decode failed", {
      error: err instanceof Error ? err.message : String(err),
      tokenPrefix: accessToken.substring(0, 20) + "...",
    });
    throw new Error("Failed to decode JWT payload");
  }

  // Validate issuer
  if (!VALID_EVE_ISSUERS.has(claims.iss)) {
    console.error("[auth] Unexpected JWT issuer", { iss: claims.iss });
    throw new Error(`Invalid JWT issuer: ${claims.iss}`);
  }

  // Validate expiry
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (!claims.exp || claims.exp <= nowSeconds) {
    console.error("[auth] JWT is expired or missing exp", { exp: claims.exp, now: nowSeconds });
    throw new Error(`JWT is expired: exp=${claims.exp}, now=${nowSeconds}`);
  }

  // Extract CharacterID from sub formatted as "CHARACTER:EVE:<id>"
  const subParts = (claims.sub ?? "").split(":");
  if (subParts.length < 3 || subParts[0] !== "CHARACTER" || subParts[1] !== "EVE") {
    console.error("[auth] Unexpected JWT sub format", { sub: claims.sub });
    throw new Error(`Unexpected JWT sub format: ${claims.sub}`);
  }
  const characterId = parseInt(subParts[2], 10);
  if (isNaN(characterId)) {
    throw new Error(`Could not parse CharacterID from sub: ${claims.sub}`);
  }

  // Normalise scopes: EVE may send an array or a single space-separated string
  const scp = claims.scp;
  const scopes = Array.isArray(scp) ? scp.join(" ") : (scp ?? "");

  return {
    CharacterID: characterId,
    CharacterName: claims.name,
    ExpiresOn: new Date(claims.exp * 1000).toISOString(),
    Scopes: scopes,
    TokenType: "Character",
    CharacterOwnerHash: claims.owner ?? "",
    IntellectualProperty: "EVE",
  };
}

async function fetchUserDataFromSeat(characterId: number): Promise<SessionUserData | null> {
  try {
    console.log(`[auth] fetchUserDataFromSeat start`, { characterId });
    // 1) character sheet → user_id
    const sheet = await seatApiService.getCharacterSheet(characterId);
    if (!sheet) {
      console.error(`Could not load character sheet for ${characterId}`);
      return null;
    }
    console.log(`[auth] sheet`, {
      userId: sheet.user_id,
      corpId: sheet.corporation?.entity_id,
      corpName: sheet.corporation?.name,
      allianceId: sheet.alliance?.entity_id,
      allianceName: sheet.alliance?.name,
    });
    const seatUserId = sheet.user_id;
    if (!seatUserId) {
      console.error(`Could not find SeAT user for character ${characterId}`);
      return null;
    }

    // 2) user info → associated_character_ids, main_character_id
    const userInfo = await seatApiService.getUserById(seatUserId);
    if (!userInfo) {
      console.error(`SeAT user ${seatUserId} not found for character ${characterId}`);
      return null;
    }
    console.log(`[auth] userInfo`, {
      seatUserId,
      associatedCharacterIds: userInfo.associated_character_ids,
      mainCharacterId: userInfo.main_character_id,
    });
    const associatedCharacterIds = userInfo.associated_character_ids || [];
    const mainCharacterId = userInfo.main_character_id;

    // 3) main character sheet → name/corp/alliance
    // skip if main character is the same as the logged-in character
    let mainSheet = sheet;
    if (mainCharacterId !== characterId) {
      const fetchedMainSheet = await seatApiService.getCharacterSheet(mainCharacterId);
      if (!fetchedMainSheet) {
        console.error(`Could not load main character sheet for ${mainCharacterId}`);
        return null;
      }
      mainSheet = fetchedMainSheet;
    }
    console.log(`[auth] mainSheet`, {
      corpId: mainSheet.corporation?.entity_id,
      corpName: mainSheet.corporation?.name,
      allianceId: mainSheet.alliance?.entity_id,
      allianceName: mainSheet.alliance?.name,
    });
    const mainCharacterName = mainSheet.name;
    const mainCharacterCorporationId = mainSheet.corporation?.entity_id;
    const mainCharacterCorporationName = mainSheet.corporation?.name;
    const mainCharacterAllianceId = mainSheet.alliance?.entity_id;
    const mainCharacterAllianceName = mainSheet.alliance?.name;

    const profileImageUrl = `https://images.evetech.net/characters/${mainCharacterId}/portrait?size=128`;

    return {
      seatUserId,
      mainCharacterId,
      mainCharacterName,
      profileImageUrl,
      mainCharacterCorporationId,
      mainCharacterCorporationName,
      mainCharacterAllianceId,
      mainCharacterAllianceName,
      associatedCharacterIds,
    };
  } catch (error) {
    console.error("Error fetching user data from SeAT:", error);
    return null;
  }
}

interface ProcessLoginResult {
  success: boolean;
  error?: string;
  userData?: SessionUserData;
}

async function processLogin(req: Request, characterId: number): Promise<ProcessLoginResult> {
  // Fetch user data from SeAT
  const userData = await fetchUserDataFromSeat(characterId);
  
  if (!userData) {
    return { success: false, error: "seat_user_not_found" };
  }

  // Check corp/alliance restrictions
  const allowedCorpIds = process.env.ALLOWED_CORP_IDS?.split(",").map((id: string) => parseInt(id.trim(), 10)).filter((id: number) => !isNaN(id)) || [];
  const allowedAllianceIds = process.env.ALLOWED_ALLIANCE_IDS?.split(",").map((id: string) => parseInt(id.trim(), 10)).filter((id: number) => !isNaN(id)) || [];
  
  const hasRestrictions = allowedCorpIds.length > 0 || allowedAllianceIds.length > 0;
  if (hasRestrictions) {
    const isAllowedCorp = allowedCorpIds.length > 0 && userData.mainCharacterCorporationId && allowedCorpIds.includes(userData.mainCharacterCorporationId);
    const isAllowedAlliance = allowedAllianceIds.length > 0 && userData.mainCharacterAllianceId && allowedAllianceIds.includes(userData.mainCharacterAllianceId);
    
    if (!isAllowedCorp && !isAllowedAlliance) {
      console.log(`Access denied for ${userData.mainCharacterName}: corp=${userData.mainCharacterCorporationId}, alliance=${userData.mainCharacterAllianceId}`);
      return { success: false, error: "access_denied" };
    }
  }

  // Setup session
  req.session.user = userData;
  console.log(`User logged in: seatUserId=${userData.seatUserId}, characterName=${userData.mainCharacterName}`);

  return { success: true, userData };
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  // Login route - redirect to EVE SSO
  app.get("/api/login", (req: Request, res: Response) => {
    const clientId = process.env.EVE_CLIENT_ID;
    
    if (!clientId) {
      return res.status(500).json({ message: "EVE SSO not configured" });
    }

    const state = crypto.randomBytes(16).toString("hex");
    req.session.oauthState = state;

    const redirectUri = `${req.protocol}://${req.get("host")}/api/auth/callback`;
    
    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      state: state,
    });

    res.redirect(`${EVE_SSO_AUTH_URL}?${params.toString()}`);
  });

  // Callback route - handle EVE SSO response
  app.get("/api/auth/callback", async (req: Request, res: Response) => {
    try {
      const { code, state } = req.query;

      if (!code || typeof code !== "string") {
        return res.redirect("/?error=no_code");
      }

      if (state !== req.session.oauthState) {
        return res.redirect("/?error=state_mismatch");
      }

      delete req.session.oauthState;

      const redirectUri = `${req.protocol}://${req.get("host")}/api/auth/callback`;
      const tokens = await exchangeCodeForToken(code, redirectUri);
      const characterInfo = await getCharacterInfo(tokens.access_token);

      // Process login (fetch from SeAT + check restrictions + setup session)
      const result = await processLogin(req, characterInfo.CharacterID);
      
      if (!result.success) {
        return res.redirect(`/?error=${result.error}`);
      }

      res.redirect("/");
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error("[auth] EVE SSO callback error", {
        message: err.message,
        stack: err.stack,
        requestContext: {
          method: req.method,
          path: req.path,
          state: typeof req.query.state === "string" ? req.query.state : undefined,
          hasCode: typeof req.query.code === "string",
        },
      });
      res.redirect("/?error=auth_failed");
    }
  });

  // Development mode SSO bypass
  if (process.env.NODE_ENV === "development") {
    app.get("/api/auth/dev-login", async (req: Request, res: Response) => {
      try {
        const { characterId } = req.query;
        
        if (!characterId || typeof characterId !== "string") {
          return res.status(400).json({ message: "characterId query parameter required" });
        }

        const charId = parseInt(characterId, 10);
        if (isNaN(charId)) {
          return res.status(400).json({ message: "Invalid characterId" });
        }

        console.log(`[dev-login] Attempting dev login with characterId: ${charId}`);

        // Process login (fetch from SeAT + check restrictions + setup session) - same as regular SSO
        const result = await processLogin(req, charId);
        
        if (!result.success) {
          return res.redirect(`/?error=${result.error}`);
        }

        console.log(`[dev-login] Dev login successful for ${result.userData?.mainCharacterName}`);
        res.redirect("/");
      } catch (error) {
        console.error("Dev login error:", error);
        res.redirect("/?error=dev_auth_failed");
      }
    });
  }

  // Logout route
  app.get("/api/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destroy error:", err);
      }
      res.redirect("/");
    });
  });

}

export const isAuthenticated: RequestHandler = (req: Request, res: Response, next) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  return next();
};

export function registerAuthRoutes(app: Express): void {
  app.get("/api/auth/user", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.session.user;
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        seatUserId: user.seatUserId,
        characterId: user.mainCharacterId,
        characterName: user.mainCharacterName,
        profileImageUrl: user.profileImageUrl,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}
