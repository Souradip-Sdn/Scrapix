import postgres from "postgres";
import fs from "node:fs";
import path from "node:path";

// Load .env file manually since node doesn't do it by default
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
} catch (err) {
  console.warn("Could not load .env file:", err.message);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Please define DATABASE_URL in your environment.");
  process.exit(1);
}

const sql = postgres(connectionString, {
  ssl: connectionString.includes("supabase.co") || connectionString.includes("neon.tech") ? { rejectUnauthorized: false } : false,
});

async function main() {
  console.log("Altering table users...");
  try {
    await sql.unsafe(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS bank_account_number TEXT DEFAULT '',
      ADD COLUMN IF NOT EXISTS bank_ifsc_code TEXT DEFAULT '',
      ADD COLUMN IF NOT EXISTS bank_name TEXT DEFAULT '';
    `);
    console.log("Migration successful.");
  } catch (err) {
    console.error("Error migrating:", err);
  }
  await sql.end();
}

main();
