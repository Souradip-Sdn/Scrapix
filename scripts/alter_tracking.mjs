import postgres from "postgres";
import fs from "node:fs";
import path from "node:path";

// Load .env manually
try {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    envContent.split(/\r?\n/).forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || "";
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
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
  ssl:
    connectionString.includes("supabase.co") ||
    connectionString.includes("neon.tech")
      ? { rejectUnauthorized: false }
      : false,
});

async function main() {
  console.log("Altering pickup_requests table for tracking...");
  await sql.unsafe(`
    ALTER TABLE pickup_requests
      ADD COLUMN IF NOT EXISTS partner_id INTEGER,
      ADD COLUMN IF NOT EXISTS partner_lat  DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS partner_lng  DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS partner_last_seen TIMESTAMP WITH TIME ZONE;
  `);
  console.log("✅ Columns added: partner_id, partner_lat, partner_lng, partner_last_seen");

  await sql.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
