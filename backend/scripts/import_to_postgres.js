const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const targetUrl = process.argv[2] || process.env.DATABASE_URL;

if (!targetUrl) {
  console.error('❌ Please provide a PostgreSQL DATABASE_URL.');
  console.error('Usage: node backend/scripts/import_to_postgres.js "postgresql://user:pass@host:port/dbname"');
  process.exit(1);
}

const rootDir = path.resolve(__dirname, '..', '..');
const jsonPath = path.join(rootDir, 'database', 'exports', 'all_portal_data.json');
const sqlPath = path.join(rootDir, 'database', 'exports', 'all_portal_data.sql');

if (!fs.existsSync(jsonPath)) {
  console.error('❌ database/exports/all_portal_data.json not found. Run export first: node backend/scripts/export_data.js');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

async function importData() {
  const isLocal = targetUrl.includes('localhost') || targetUrl.includes('127.0.0.1');
  const isSslDisabled = targetUrl.includes('sslmode=disable') || targetUrl.includes('ssl=false');

  console.log(`🚀 Connecting to PostgreSQL at ${targetUrl.split('@')[1] || targetUrl}...`);

  const pool = new Pool({
    connectionString: targetUrl,
    ssl: !isLocal && !isSslDisabled ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000
  });

  try {
    // 1. Create table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS portal_storage (
        key VARCHAR(64) PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Upload portal state
    await pool.query(`
      INSERT INTO portal_storage (key, data, updated_at)
      VALUES ('portal_state', $1, NOW())
      ON CONFLICT (key) DO UPDATE
      SET data = EXCLUDED.data, updated_at = NOW();
    `, [JSON.stringify(data)]);

    console.log(`✅ Successfully uploaded portal state to PostgreSQL!`);
    console.log(`📊 Statistics:`);
    console.log(`   - Students: ${data.students?.length || 0}`);
    console.log(`   - Admins: ${data.admins?.length || 0}`);
    console.log(`   - GD Sessions: ${data.gd_sessions?.length || 0}`);
    console.log(`   - GD Participants: ${data.gd_participants?.length || 0}`);
    console.log(`   - Assessments: ${data.assessments?.length || 0}`);
    console.log(`   - Questions: ${data.questions?.length || 0}`);
    console.log(`   - Study Materials: ${data.study_materials?.length || 0}`);

    // If sql dump exists, run table creation statements
    if (fs.existsSync(sqlPath)) {
      const sqlContent = fs.readFileSync(sqlPath, 'utf8');
      try {
        await pool.query(sqlContent);
        console.log(`✅ Relational tables (admins, students, gd_sessions, gd_participants) also populated!`);
      } catch (sqlErr) {
        console.warn(`Notice on relational tables: ${sqlErr.message}`);
      }
    }

    await pool.end();
    console.log(`🎉 Import to PostgreSQL complete!`);
  } catch (err) {
    console.error(`❌ Failed to import to PostgreSQL:`, err.message);
    await pool.end().catch(() => {});
    process.exit(1);
  }
}

importData();
