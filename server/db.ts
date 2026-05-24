import { drizzle } from "drizzle-orm/mysql2";
import { users, promoCodes, promoCodeUsage } from "../drizzle/schema";
import { eq, sql, type SQL } from "drizzle-orm";
import type { InsertPromoCode, InsertPromoCodeUsage } from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

async function findUser(condition: SQL) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(condition).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export const getUserById = (id: number) => findUser(eq(users.id, id));
export const getUserByEmail = (email: string) => findUser(eq(users.email, email));

export async function createUser(data: { name: string; email: string; passwordHash: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(users).values({
    name: data.name,
    email: data.email,
    passwordHash: data.passwordHash,
    loginMethod: "email",
    lastSignedIn: new Date(),
  });
  const user = await getUserByEmail(data.email);
  if (!user) throw new Error("Failed to retrieve created user");
  return user;
}


// ─── Promo Code Helpers ───────────────────────────────────────────────────────

export async function getPromoCodeByCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(promoCodes)
    .where(eq(promoCodes.code, code.toUpperCase()))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function validatePromoCode(
  code: string,
  tier: string
): Promise<{
  valid: boolean;
  discount?: number;
  discountType?: string;
  message?: string;
}> {
  const promo = await getPromoCodeByCode(code);

  if (!promo) {
    return { valid: false, message: "Invalid promo code" };
  }

  if (!promo.isActive) {
    return { valid: false, message: "Promo code is inactive" };
  }

  if (promo.expiresAt && new Date() > promo.expiresAt) {
    return { valid: false, message: "Promo code expired" };
  }

  if (promo.maxUses && promo.currentUses >= promo.maxUses) {
    return { valid: false, message: "Promo code limit reached" };
  }

  if (promo.tier !== tier) {
    return { valid: false, message: `Code not valid for ${tier} tier` };
  }

  return {
    valid: true,
    discount: Number(promo.discountValue),
    discountType: promo.discountType,
  };
}

export async function createPromoCode(data: InsertPromoCode) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(promoCodes).values({
    ...data,
    code: data.code.toUpperCase(),
  });
  return result;
}

export async function incrementPromoCodeUsage(codeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db
    .update(promoCodes)
    .set({ currentUses: sql`${promoCodes.currentUses} + 1` })
    .where(eq(promoCodes.id, codeId));
}

export async function logPromoCodeUsage(data: InsertPromoCodeUsage) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(promoCodeUsage).values(data);
}

export async function getPromoCodeStats(codeId: number) {
  const db = await getDb();
  if (!db) return { totalUses: 0, totalDiscount: 0, totalRevenue: 0, averageDiscount: 0 };

  const usage = await db
    .select()
    .from(promoCodeUsage)
    .where(eq(promoCodeUsage.codeId, codeId));

  const totalDiscount = usage.reduce((sum, u) => sum + Number(u.discountAmount), 0);
  const totalRevenue = usage.reduce((sum, u) => sum + Number(u.finalPrice), 0);

  return {
    totalUses: usage.length,
    totalDiscount,
    totalRevenue,
    averageDiscount: usage.length > 0 ? totalDiscount / usage.length : 0,
  };
}

export async function getAllPromoCodes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(promoCodes).where(eq(promoCodes.isActive, true));
}

export async function getPromoCodeById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(promoCodes).where(eq(promoCodes.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}
