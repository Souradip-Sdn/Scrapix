import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is missing.");
}

const globalForDb = globalThis as unknown as { sql?: ReturnType<typeof postgres> };
const db = globalForDb.sql ?? postgres(connectionString, {
  ssl: connectionString.includes("supabase.co") || connectionString.includes("neon.tech") ? { rejectUnauthorized: false } : false,
});

if (process.env.NODE_ENV !== "production") globalForDb.sql = db;

// Run migrations asynchronously
(async () => {
  try {
    await db.unsafe(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'customer' CHECK(role IN ('customer','partner','admin')),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS materials (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        category TEXT NOT NULL,
        rate_per_kg DOUBLE PRECISION NOT NULL,
        co2_factor DOUBLE PRECISION NOT NULL,
        active INTEGER NOT NULL DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS services (
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

      CREATE TABLE IF NOT EXISTS pickup_requests (
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

      CREATE TABLE IF NOT EXISTS partner_profiles (
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

      CREATE TABLE IF NOT EXISTS organization_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        company_name TEXT NOT NULL,
        org_type TEXT NOT NULL CHECK(org_type IN ('private','government')),
        gst_number TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS impact_entries (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        pickup_id INTEGER NOT NULL UNIQUE REFERENCES pickup_requests(id) ON DELETE CASCADE,
        recycled_kg DOUBLE PRECISION NOT NULL,
        co2_saved_kg DOUBLE PRECISION NOT NULL,
        trees_equivalent DOUBLE PRECISION NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        read_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_pickups_user ON pickup_requests(user_id);
      CREATE INDEX IF NOT EXISTS idx_pickups_status ON pickup_requests(status);
      CREATE INDEX IF NOT EXISTS idx_partner_status ON partner_profiles(status);
    `);

    const [{ count: materialCount }] = await db`SELECT COUNT(*)::int AS count FROM materials`;
    if (materialCount === 0) {
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
      await db`INSERT INTO materials (name, category, rate_per_kg, co2_factor) VALUES ${db(materials.map(m => [m.name, m.category, m.rate_per_kg, m.co2_factor]))}`;
    }

    const [{ count: serviceCount }] = await db`SELECT COUNT(*)::int AS count FROM services`;
    if (serviceCount === 0) {
      const services = [
        ["Enterprise Data Sync", "Real-time ecological telemetry and compliance pipeline.", "Data Analytics", "subscription", 699, "month", 1],
        ["Carbon Footprint API", "Automated emissions calculations for your product or platform.", "Carbon Tracking", "usage", 0.02, "API call", 1],
        ["Certified E-Waste Pickup", "Doorstep collection with digital chain-of-custody certificate.", "Collection", "fixed", 299, "pickup", 1],
        ["ESG Compliance Report", "Audit-ready sustainability report for boards and regulators.", "Consulting", "fixed", 14999, "report", 0],
        ["Material Recovery Audit", "On-site waste stream audit and recovery opportunity map.", "Consulting", "fixed", 24999, "audit", 0],
        ["Bulk Asset Sanitization", "Secure certified data wiping before electronics recycling.", "Data Security", "unit", 450, "device", 0]
      ];
      await db`INSERT INTO services (name, description, category, pricing_model, price, unit, featured) VALUES ${db(services)}`;
    }

    const [{ count: userCount }] = await db`SELECT COUNT(*)::int AS count FROM users`;
    if (userCount === 0) {
      const bcrypt = await import("bcryptjs");
      const hash = bcrypt.default.hashSync("Scrapix@123", 10);
      
      const [admin] = await db`
        INSERT INTO users (name, email, phone, password_hash, role) 
        VALUES ('Scrapix Admin', 'admin@scrapix.local', '9000000001', ${hash}, 'admin')
        RETURNING id
      `;
      
      const [customer] = await db`
        INSERT INTO users (name, email, phone, password_hash, role) 
        VALUES ('Demo Customer', 'customer@scrapix.local', '9000000002', ${hash}, 'customer')
        RETURNING id
      `;
      
      const [partner] = await db`
        INSERT INTO users (name, email, phone, password_hash, role) 
        VALUES ('Demo Partner', 'partner@scrapix.local', '9000000003', ${hash}, 'partner')
        RETURNING id
      `;
      
      await db`
        INSERT INTO partner_profiles (user_id, business_name, business_type, gst_number, address, city, state, pincode, monthly_capacity_kg, service_radius_km, status, reviewed_at)
        VALUES (${partner.id}, 'GreenLoop Recycling Pvt Ltd', 'recycler', '16ABCDE1234F1Z5', 'Industrial Estate, Bodhjungnagar', 'Agartala', 'Tripura', '799008', 25000, 80, 'approved', CURRENT_TIMESTAMP)
      `;
      
      const [m] = await db`
        SELECT id, rate_per_kg FROM materials WHERE name = 'Laptops & PCs'
      `;
      
      const [pickup] = await db`
        INSERT INTO pickup_requests (request_no, user_id, material_id, weight_kg, estimated_value, address, city, pincode, preferred_date, notes, status, completed_at)
        VALUES (${'ECO-' + Date.now().toString().slice(-8)}, ${customer.id}, ${m.id}, 12, ${12 * m.rate_per_kg}, 'Demo Address, Central Road', 'Agartala', '799001', (CURRENT_DATE + INTERVAL '2 day')::text, 'Seed completed pickup', 'completed', CURRENT_TIMESTAMP)
        RETURNING id
      `;
      
      await db`
        INSERT INTO impact_entries (user_id, pickup_id, recycled_kg, co2_saved_kg, trees_equivalent) 
        VALUES (${customer.id}, ${pickup.id}, 12, 74.4, 3.38)
      `;
    }
  } catch (e) {
    console.error("Database initialization failed:", e);
  }
})();

export default db;
