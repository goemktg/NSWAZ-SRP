const SEAT_API_BASE = "https://seat.nisuwaz.com";

interface SeatEntity {
  entity_id: number;
  name: string;
  category?: string;
}

interface SeatCharacterSheet {
  data: {
    character_id?: number;
    name: string;
    description?: string;
    corporation?: SeatEntity;
    alliance?: SeatEntity;
    faction?: SeatEntity;
    user_id?: number;
  };
}

export type CharacterSheetData = SeatCharacterSheet["data"];

interface SeatUserCharacters {
  data: Array<{
    character_id: number;
    name: string;
    corporation_id: number;
    corporation?: {
      name: string;
    };
    alliance_id?: number;
    alliance?: {
      name: string;
    };
  }>;
}

interface SeatUserInfo {
  data: {
    id: number;
    name: string;
    email: string;
    active: boolean;
    last_login: string;
    last_login_source: string;
    associated_character_ids: number[];
    main_character_id: number;
  };
}

export class SeatApiService {
  private apiToken: string;

  constructor() {
    const token = process.env.SEAT_API_TOKEN;
    if (!token) {
      console.warn("SEAT_API_TOKEN not configured - character sync will be disabled");
    }
    this.apiToken = token || "";
  }

  private async fetchApi<T>(endpoint: string): Promise<T | null> {
    if (!this.apiToken) {
      console.warn("SeAT API token not configured");
      return null;
    }

    try {
      const response = await fetch(`${SEAT_API_BASE}${endpoint}`, {
        headers: {
          "Accept": "application/json",
          "X-Token": this.apiToken,
        },
      });

      if (!response.ok) {
        console.error(`SeAT API error: ${response.status} ${response.statusText}`);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("SeAT API fetch error:", error);
      return null;
    }
  }

  async getCharacterSheet(characterId: number): Promise<SeatCharacterSheet["data"] | null> {
    const result = await this.fetchApi<SeatCharacterSheet>(`/api/v2/character/sheet/${characterId}`);
    return result?.data || null;
  }

  async getUserCharacters(seatUserId: number): Promise<SeatUserCharacters["data"] | null> {
    const result = await this.fetchApi<SeatUserCharacters>(`/api/v2/users/${seatUserId}/characters`);
    return result?.data || null;
  }

  async getUserById(seatUserId: number): Promise<SeatUserInfo["data"] | null> {
    const result = await this.fetchApi<SeatUserInfo>(`/api/v2/users/${seatUserId}`);
    return result?.data || null;
  }

  async getAssociatedCharacterIds(characterId: number): Promise<number[]> {
    const characterSheet = await this.getCharacterSheet(characterId);
    if (!characterSheet || !characterSheet.user_id) {
      return [];
    }

    const userInfo = await this.getUserById(characterSheet.user_id);
    if (!userInfo || !userInfo.associated_character_ids) {
      return [];
    }

    return userInfo.associated_character_ids;
  }

  async getSeatUserIdForCharacter(characterId: number): Promise<number | null> {
    const characterSheet = await this.getCharacterSheet(characterId);
    return characterSheet?.user_id || null;
  }
}

export const seatApiService = new SeatApiService();

// ESI character name resolution
export async function resolveCharacterNames(characterIds: number[]): Promise<Map<number, string>> {
  const nameMap = new Map<number, string>();
  if (characterIds.length === 0) return nameMap;

  try {
    const response = await fetch("https://esi.evetech.net/latest/universe/names/?datasource=tranquility", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(characterIds),
    });

    if (!response.ok) {
      console.error("ESI universe/names error:", response.status);
      return nameMap;
    }

    const results: Array<{ id: number; name: string; category: string }> = await response.json();
    for (const result of results) {
      if (result.category === "character") {
        nameMap.set(result.id, result.name);
      }
    }
  } catch (error) {
    console.error("ESI universe/names fetch error:", error);
  }

  return nameMap;
}
