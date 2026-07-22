import postgres from "postgres";
import fs from "node:fs";
import path from "node:path";

try {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    envContent.split(/\r?\n/).forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || "";
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.slice(1, -1);
        }
        process.env[key] = value.trim();
      }
    });
  }
} catch (err) {}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) process.exit(1);

const sql = postgres(connectionString, {
  ssl: connectionString.includes("supabase.co") || connectionString.includes("neon.tech") ? { rejectUnauthorized: false } : false,
});

async function main() {
  console.log("Altering users table...");
  try {
    await sql.unsafe(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS address TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS city TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS state TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS pincode TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
    `);
    console.log("Added columns successfully!");
  } catch (err) {
    console.error("Failed to alter table:", err);
  }
  await sql.end();
}
main();
