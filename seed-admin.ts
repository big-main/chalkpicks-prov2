import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import { users } from "./drizzle/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const db = drizzle(process.env.DATABASE_URL);
  
  const adminEmail = "admin@chalkpicks.live";
  const adminPassword = "AdminPassword123!"; // You should change this after first login
  const adminName = "ChalkPicks Admin";

  console.log(`Setting up admin account for ${adminEmail}...`);

  const existingUser = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  if (existingUser.length > 0) {
    console.log("Admin user already exists. Updating to admin role and resetting password...");
    await db.update(users)
      .set({ 
        role: "admin", 
        passwordHash,
        subscriptionTier: "yearly",
        subscriptionExpiresAt: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000) // 100 years
      })
      .where(eq(users.id, existingUser[0].id));
  } else {
    console.log("Creating new admin account...");
    await db.insert(users).values({
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: "admin",
      loginMethod: "email",
      subscriptionTier: "yearly",
      subscriptionExpiresAt: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000), // 100 years
      lastSignedIn: new Date(),
    });
  }

  console.log("Admin account setup complete!");
  console.log(`Email: ${adminEmail}`);
  console.log(`Password: ${adminPassword}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to setup admin account:", err);
  process.exit(1);
});
