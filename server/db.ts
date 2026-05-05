import { eq, SQL } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { users } from "../drizzle/schema";

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
