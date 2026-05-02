import { eq, SQL } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

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
export const getUserByOpenId = (openId: string) => findUser(eq(users.openId, openId));

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

export async function upsertUser(user: Partial<InsertUser> & { openId?: string }): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: Record<string, unknown> = {};
    const updateSet: Record<string, unknown> = {};

    if (user.openId !== undefined) values.openId = user.openId;

    const textFields = ["name", "email", "loginMethod"] as const;
    for (const field of textFields) {
      const value = user[field];
      if (value === undefined) continue;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    }

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId && user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values as InsertUser).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

