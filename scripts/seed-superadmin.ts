import "dotenv/config";
import { eq } from "drizzle-orm";
import { requireDb } from "../src/lib/db";
import { userPreferences, users } from "../src/lib/db/schema";
import { hashPassword } from "../src/lib/auth/passwords";
import { DEFAULT_SUPERADMIN_EMAIL } from "../src/lib/constants";

async function main() {
  const email = (
    process.env.SUPERADMIN_EMAIL ?? DEFAULT_SUPERADMIN_EMAIL
  ).toLowerCase();
  const password = process.env.SUPERADMIN_PASSWORD;

  if (!password) {
    console.error("SUPERADMIN_PASSWORD is required");
    process.exit(1);
  }

  const database = requireDb();
  const passwordHash = await hashPassword(password);

  const [existing] = await database
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    await database
      .update(users)
      .set({ role: "superadmin", passwordHash, emailVerified: new Date() })
      .where(eq(users.id, existing.id));
    console.log(`Updated superadmin: ${email}`);
  } else {
    const [created] = await database
      .insert(users)
      .values({
        email,
        name: "Super Admin",
        role: "superadmin",
        passwordHash,
        emailVerified: new Date(),
      })
      .returning();
    if (created) {
      await database.insert(userPreferences).values({ userId: created.id });
    }
    console.log(`Created superadmin: ${email}`);
  }

  console.log("Done. Login at /login with these credentials.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
