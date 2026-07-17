import postgres from "postgres";
import bcrypt from "bcryptjs";

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
  console.log("Dropping existing tables if any...");
  await sql.unsafe(`
    DROP TABLE IF EXISTS notifications CASCADE;
    DROP TABLE IF EXISTS impact_entries CASCADE;
    DROP TABLE IF EXISTS organization_profiles CASCADE;
    DROP TABLE IF EXISTS partner_profiles CASCADE;
    DROP TABLE IF EXISTS pickup_requests CASCADE;
    DROP TABLE IF EXISTS services CASCADE;
    DROP TABLE IF EXISTS materials CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
  `);

  console.log("Creating tables...");
  await sql.unsafe(`
    CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer' CHECK(role IN ('customer','partner','admin')),
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE materials (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL,
      rate_per_kg DOUBLE PRECISION NOT NULL,
      co2_factor DOUBLE PRECISION NOT NULL,
      active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE services (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      pricing_model TEXT NOT NULL,
      price DOUBLE PRECISION NOT NULL,
      unit TEXT NOT NULL,
      featured INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE pickup_requests (
      id SERIAL PRIMARY KEY,
      request_no TEXT NOT NULL UNIQUE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      material_id INTEGER NOT NULL REFERENCES materials(id),
      weight_kg DOUBLE PRECISION NOT NULL,
      estimated_value DOUBLE PRECISION NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      pincode TEXT NOT NULL,
      preferred_date TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','scheduled','collected','completed','cancelled')),
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP WITH TIME ZONE
    );

    CREATE TABLE partner_profiles (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      business_name TEXT NOT NULL,
      business_type TEXT NOT NULL,
      gst_number TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      pincode TEXT NOT NULL,
      monthly_capacity_kg DOUBLE PRECISION NOT NULL,
      service_radius_km DOUBLE PRECISION NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
      reviewed_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE organization_profiles (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      company_name TEXT NOT NULL,
      org_type TEXT NOT NULL CHECK(org_type IN ('private','government')),
      gst_number TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE impact_entries (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      pickup_id INTEGER NOT NULL UNIQUE REFERENCES pickup_requests(id) ON DELETE CASCADE,
      recycled_kg DOUBLE PRECISION NOT NULL,
      co2_saved_kg DOUBLE PRECISION NOT NULL,
      trees_equivalent DOUBLE PRECISION NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      read_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX idx_pickups_user ON pickup_requests(user_id);
    CREATE INDEX idx_pickups_status ON pickup_requests(status);
    CREATE INDEX idx_partner_status ON partner_profiles(status);
  `);

  console.log("Seeding materials...");
  const materials = [
    { name: "Air Conditioner Unit", category: "Appliances", rate_per_kg: 165, co2_factor: 4.6 },
    { name: "Refrigerator", category: "Appliances", rate_per_kg: 110, co2_factor: 3.8 },
    { name: "Laptops & PCs", category: "Computers", rate_per_kg: 240, co2_factor: 6.2 },
    { name: "Smartphones", category: "Mobile", rate_per_kg: 520, co2_factor: 8.1 },
    { name: "Copper Cable", category: "Metals", rate_per_kg: 610, co2_factor: 2.9 },
    { name: "Solar Panels", category: "Renewables", rate_per_kg: 95, co2_factor: 5.4 },
    { name: "Batteries", category: "Energy Storage", rate_per_kg: 135, co2_factor: 3.2 },
    { name: "Mixed Electronic Scrap", category: "E-Waste", rate_per_kg: 72, co2_factor: 2.5 },
  ];
  await sql`INSERT INTO materials (name, category, rate_per_kg, co2_factor) VALUES ${sql(materials.map(m => [m.name, m.category, m.rate_per_kg, m.co2_factor]))}`;

  console.log("Seeding services...");
  const services = [
    ["Enterprise Data Sync", "Real-time ecological telemetry and compliance pipeline.", "Data Analytics", "subscription", 699, "month", 1],
    ["Carbon Footprint API", "Automated emissions calculations for your product or platform.", "Carbon Tracking", "usage", 0.02, "API call", 1],
    ["Certified E-Waste Pickup", "Doorstep collection with digital chain-of-custody certificate.", "Collection", "fixed", 299, "pickup", 1],
    ["ESG Compliance Report", "Audit-ready sustainability report for boards and regulators.", "Consulting", "fixed", 14999, "report", 0],
    ["Material Recovery Audit", "On-site waste stream audit and recovery opportunity map.", "Consulting", "fixed", 24999, "audit", 0],
    ["Bulk Asset Sanitization", "Secure certified data wiping before electronics recycling.", "Data Security", "unit", 450, "device", 0]
  ];
  await sql`INSERT INTO services (name, description, category, pricing_model, price, unit, featured) VALUES ${sql(services)}`;

  console.log("Seeding users...");
  const hash = bcrypt.hashSync("Scrapix@123", 10);
  
  const [admin] = await sql`
    INSERT INTO users (name, email, phone, password_hash, role) 
    VALUES ('Scrapix Admin', 'admin@scrapix.local', '9000000001', ${hash}, 'admin')
    RETURNING id
  `;
  
  const [customer] = await sql`
    INSERT INTO users (name, email, phone, password_hash, role) 
    VALUES ('Demo Customer', 'customer@scrapix.local', '9000000002', ${hash}, 'customer')
    RETURNING id
  `;
  
  const [partner] = await sql`
    INSERT INTO users (name, email, phone, password_hash, role) 
    VALUES ('Demo Partner', 'partner@scrapix.local', '9000000003', ${hash}, 'partner')
    RETURNING id
  `;
  
  await sql`
    INSERT INTO partner_profiles (user_id, business_name, business_type, gst_number, address, city, state, pincode, monthly_capacity_kg, service_radius_km, status, reviewed_at)
    VALUES (${partner.id}, 'GreenLoop Recycling Pvt Ltd', 'recycler', '16ABCDE1234F1Z5', 'Industrial Estate, Bodhjungnagar', 'Agartala', 'Tripura', '799008', 25000, 80, 'approved', CURRENT_TIMESTAMP)
  `;
  
  const [m] = await sql`
    SELECT id, rate_per_kg FROM materials WHERE name = 'Laptops & PCs'
  `;
  
  const [pickup] = await sql`
    INSERT INTO pickup_requests (request_no, user_id, material_id, weight_kg, estimated_value, address, city, pincode, preferred_date, notes, status, completed_at)
    VALUES (${'ECO-' + Date.now().toString().slice(-8)}, ${customer.id}, ${m.id}, 12, ${12 * m.rate_per_kg}, 'Demo Address, Central Road', 'Agartala', '799001', (CURRENT_DATE + INTERVAL '2 day')::text, 'Seed completed pickup', 'completed', CURRENT_TIMESTAMP)
    RETURNING id
  `;
  
  await sql`
    INSERT INTO impact_entries (user_id, pickup_id, recycled_kg, co2_saved_kg, trees_equivalent) 
    VALUES (${customer.id}, ${pickup.id}, 12, 74.4, 3.38)
  `;

  console.log("Database seeded successfully.");
  await sql.end();
}

main().catch((err) => {
  console.error("Error seeding database:", err);
  process.exit(1);
});
