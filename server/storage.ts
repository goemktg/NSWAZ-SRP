import { 
  users, 
  userRoles, 
  srpRequests,
  type User,
  type UserRole,
  type InsertUserRole,
  type SrpRequest,
  type InsertSrpRequest,
  type SrpRequestWithDetails,
  type DashboardStats
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count } from "drizzle-orm";
import { shipCatalogService } from "./services/shipCatalog";

export interface IStorage {
  // User roles
  getUserRole(userId: string): Promise<UserRole | undefined>;
  createUserRole(data: InsertUserRole): Promise<UserRole>;
  updateUserRole(userId: string, role: string): Promise<UserRole | undefined>;

  // SRP Requests
  getSrpRequests(userId?: string, status?: string): Promise<SrpRequestWithDetails[]>;
  getSrpRequest(id: string): Promise<SrpRequestWithDetails | undefined>;
  createSrpRequest(userId: string, data: InsertSrpRequest): Promise<SrpRequest>;
  updateSrpRequest(id: string, data: Partial<SrpRequest>): Promise<SrpRequest | undefined>;
  reviewSrpRequest(id: string, reviewerId: string, status: string, note?: string, payout?: number): Promise<SrpRequest | undefined>;

  // Stats
  getDashboardStats(): Promise<DashboardStats>;
}

export class DatabaseStorage implements IStorage {
  // User roles
  async getUserRole(userId: string): Promise<UserRole | undefined> {
    const [role] = await db.select().from(userRoles).where(eq(userRoles.userId, userId));
    return role || undefined;
  }

  async createUserRole(data: InsertUserRole): Promise<UserRole> {
    const [role] = await db.insert(userRoles).values(data).returning();
    return role;
  }

  async updateUserRole(userId: string, role: string): Promise<UserRole | undefined> {
    const [updated] = await db
      .update(userRoles)
      .set({ role: role as any })
      .where(eq(userRoles.userId, userId))
      .returning();
    return updated || undefined;
  }

  // SRP Requests
  async getSrpRequests(userId?: string, status?: string): Promise<SrpRequestWithDetails[]> {
    let conditions = [];
    if (userId) {
      conditions.push(eq(srpRequests.userId, userId));
    }
    if (status && status !== "all") {
      conditions.push(eq(srpRequests.status, status as any));
    }

    const requests = await db
      .select()
      .from(srpRequests)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(srpRequests.createdAt));

    // Get pilot names
    const userIds = Array.from(new Set(requests.map(r => r.userId)));
    const pilotUsers = userIds.length > 0 
      ? await db.select().from(users).where(sql`${users.id} = ANY(ARRAY[${sql.join(userIds.map(id => sql`${id}`), sql`, `)}])`)
      : [];
    
    const userMap = new Map(pilotUsers.map(u => [u.id, u]));

    return requests.map(r => {
      const shipData = shipCatalogService.getShipByTypeId(r.shipTypeId);
      const user = userMap.get(r.userId);
      
      return {
        ...r,
        shipData: shipData,
        pilotName: user?.characterName || "알 수 없는 파일럿",
      };
    });
  }

  async getSrpRequest(id: string): Promise<SrpRequestWithDetails | undefined> {
    const [request] = await db
      .select()
      .from(srpRequests)
      .where(eq(srpRequests.id, id));

    if (!request) return undefined;

    const shipData = shipCatalogService.getShipByTypeId(request.shipTypeId);
    
    // Get pilot name
    const [pilot] = await db.select().from(users).where(eq(users.id, request.userId));
    const pilotName = pilot?.characterName || "알 수 없는 파일럿";

    return {
      ...request,
      shipData,
      pilotName,
    };
  }

  async createSrpRequest(userId: string, data: InsertSrpRequest): Promise<SrpRequest> {
    // Get ship name from catalog for denormalization
    const shipData = shipCatalogService.getShipByTypeId(data.shipTypeId);
    
    const [request] = await db
      .insert(srpRequests)
      .values({
        ...data,
        userId,
        shipTypeName: shipData?.typeName || null,
        status: "pending",
      })
      .returning();
    return request;
  }

  async updateSrpRequest(id: string, data: Partial<SrpRequest>): Promise<SrpRequest | undefined> {
    const [updated] = await db
      .update(srpRequests)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(srpRequests.id, id))
      .returning();
    return updated || undefined;
  }

  async reviewSrpRequest(
    id: string, 
    reviewerId: string, 
    status: string, 
    note?: string, 
    payout?: number
  ): Promise<SrpRequest | undefined> {
    const [updated] = await db
      .update(srpRequests)
      .set({
        status: status as any,
        reviewerId,
        reviewerNote: note || null,
        payoutAmount: payout || null,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(srpRequests.id, id))
      .returning();
    return updated || undefined;
  }

  // Stats
  async getDashboardStats(): Promise<DashboardStats> {
    // Pending count
    const [{ count: pendingCount }] = await db
      .select({ count: count() })
      .from(srpRequests)
      .where(eq(srpRequests.status, "pending"));

    // Approved today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [{ count: approvedToday }] = await db
      .select({ count: count() })
      .from(srpRequests)
      .where(and(
        eq(srpRequests.status, "approved"),
        sql`${srpRequests.reviewedAt} >= ${today}`
      ));

    // Total paid out
    const [paidResult] = await db
      .select({ total: sql<number>`COALESCE(SUM(${srpRequests.payoutAmount}), 0)` })
      .from(srpRequests)
      .where(eq(srpRequests.status, "approved"));

    // Average processing time (in hours)
    const [avgResult] = await db
      .select({ 
        avg: sql<number>`COALESCE(AVG(EXTRACT(EPOCH FROM (${srpRequests.reviewedAt} - ${srpRequests.createdAt})) / 3600), 0)` 
      })
      .from(srpRequests)
      .where(sql`${srpRequests.reviewedAt} IS NOT NULL`);

    return {
      pendingCount: Number(pendingCount) || 0,
      approvedToday: Number(approvedToday) || 0,
      totalPaidOut: Number(paidResult?.total) || 0,
      averageProcessingHours: Math.round(Number(avgResult?.avg) || 0),
    };
  }
}

export const storage = new DatabaseStorage();
