const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const rootDir = path.resolve(__dirname, '..', '..');
const dbJsonPath = path.join(rootDir, 'database', 'portal.json');
const backendJsonPath = path.join(rootDir, 'backend', 'database', 'portal.json');

let renderUrl = process.argv[2] || process.env.RENDER_URL;
const adminEmail = process.argv[3] || process.env.ADMIN_EMAIL || 'pranavannur9659@gmail.com';
const adminPassword = process.argv[4] || process.env.ADMIN_PASSWORD || '9488529035';

if (!renderUrl || renderUrl.includes('your-app.onrender.com') || renderUrl.includes('example.com')) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('❌ RENDER_URL is not configured yet!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Please provide your real Render Backend URL:');
  console.log('');
  console.log('  Option A: Run with your URL directly in the command:');
  console.log('    npm --prefix backend run sync-render "https://YOUR-ACTUAL-APP.onrender.com"');
  console.log('');
  console.log('  Option B: Put your real URL in backend/.env on line 20:');
  console.log('    RENDER_URL=https://YOUR-ACTUAL-APP.onrender.com');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  process.exit(1);
}

// Ensure url format (remove trailing slash)
renderUrl = renderUrl.trim().replace(/\/+$/, '');

async function syncFromRender() {
  console.log(`🌐 Connecting to live Render portal: ${renderUrl}...`);

  // 1. Authenticate with Render as Super Admin
  let token;
  try {
    const loginRes = await fetch(`${renderUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        login_id: adminEmail,
        password: adminPassword
      })
    });

    const rawText = await loginRes.text();
    let loginData;
    try {
      loginData = JSON.parse(rawText);
    } catch {
      console.error(`❌ The URL (${renderUrl}) did not return a valid API response.`);
      console.error(`   Response preview: ${rawText.slice(0, 150)}...`);
      console.error(`👉 Please ensure this is your Render BACKEND URL, not the frontend website.`);
      process.exit(1);
    }

    if (!loginRes.ok || !loginData.token) {
      console.error('❌ Failed to login to Render as Super Admin:', loginData.message || loginRes.statusText);
      process.exit(1);
    }
    token = loginData.token;
    console.log(`🔑 Authenticated as Super Admin (${adminEmail})!`);
  } catch (err) {
    console.error(`❌ Could not connect to Render (${renderUrl}):`, err.message);
    process.exit(1);
  }

  // 2. Fetch complete live database state
  console.log('📦 Fetching latest database backup from Render...');
  let backupData;
  try {
    const backupRes = await fetch(`${renderUrl}/api/admins/database/backup`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!backupRes.ok) {
      const errText = await backupRes.text();
      console.error('❌ Failed to fetch backup from Render:', errText);
      process.exit(1);
    }

    backupData = await backupRes.json();
  } catch (err) {
    console.error('❌ Error downloading backup from Render:', err.message);
    process.exit(1);
  }

  if (!backupData || !Array.isArray(backupData.students)) {
    console.error('❌ Invalid backup data received from Render.');
    process.exit(1);
  }

  // 3. Save to local portal.json
  const rawJson = JSON.stringify(backupData, null, 2);
  fs.writeFileSync(dbJsonPath, rawJson, 'utf8');
  fs.writeFileSync(backendJsonPath, rawJson, 'utf8');
  console.log(`💾 Saved live data locally: database/portal.json (${(Buffer.byteLength(rawJson) / 1024).toFixed(1)} KB)`);

  // 4. Update MySQL export script
  try {
    require('./export_to_mysql.js');
  } catch (e) {
    console.warn('⚠️ Could not run export_to_mysql:', e.message);
  }

  // 5. If local MySQL is running, sync directly to MySQL Workbench!
  const mysqlHost = process.env.MYSQL_HOST || 'localhost';
  const mysqlPort = Number(process.env.MYSQL_PORT) || 3306;
  const mysqlUser = process.env.MYSQL_USER || 'root';
  const mysqlPassword = process.env.MYSQL_PASSWORD || '';
  const mysqlDatabase = process.env.MYSQL_DATABASE || 'student_portal';

  try {
    const mysql = require('mysql2/promise');
    const pool = mysql.createPool({
      host: mysqlHost,
      port: mysqlPort,
      user: mysqlUser,
      password: mysqlPassword,
      database: mysqlDatabase
    });

    await pool.query('SELECT 1 as ping;');

    // Sync master JSON
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`portal_storage\` (
        \`key\` VARCHAR(64) PRIMARY KEY,
        \`data\` LONGTEXT NOT NULL,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      INSERT INTO \`portal_storage\` (\`key\`, \`data\`, \`updated_at\`)
      VALUES ('portal_state', ?, NOW())
      ON DUPLICATE KEY UPDATE \`data\` = VALUES(\`data\`), \`updated_at\` = NOW();
    `, [JSON.stringify(backupData)]);

    // Sync Admins
    if (backupData.admins && backupData.admins.length > 0) {
      for (const a of backupData.admins) {
        await pool.query(`
          INSERT INTO \`admins\` (\`id\`, \`name\`, \`email\`, \`password\`, \`role\`, \`department\`, \`is_super_admin\`, \`created_at\`)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`), \`email\` = VALUES(\`email\`), \`password\` = VALUES(\`password\`), \`role\` = VALUES(\`role\`), \`department\` = VALUES(\`department\`);
        `, [a.id, a.name, a.email, a.password, a.role || 'ADMIN', a.department || '', a.is_super_admin ? 1 : 0, a.created_at ? new Date(a.created_at) : new Date()]);
      }
    }

    // Sync Students
    if (backupData.students && backupData.students.length > 0) {
      for (const s of backupData.students) {
        await pool.query(`
          INSERT INTO \`students\` (\`id\`, \`student_id\`, \`name\`, \`email\`, \`password\`, \`department\`, \`year\`, \`community\`, \`skill_level\`, \`profile\`, \`interest\`, \`suggested_role\`, \`status\`, \`created_at\`)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`), \`email\` = VALUES(\`email\`), \`password\` = VALUES(\`password\`), \`department\` = VALUES(\`department\`), \`year\` = VALUES(\`year\`), \`community\` = VALUES(\`community\`), \`status\` = VALUES(\`status\`);
        `, [s.id, s.student_id, s.name, s.email, s.password, s.department || '', Number(s.year) || 1, s.community || '', s.skill_level || 'Beginner', s.profile || '', s.interest || '', s.suggested_role || '', s.status || 'ACTIVE', s.created_at ? new Date(s.created_at) : new Date()]);
      }
    }

    await pool.end();
    console.log(`🐬 Successfully updated local MySQL database (\`${mysqlDatabase}\`)!`);
  } catch (dbErr) {
    console.log('ℹ️ Local MySQL auto-insert skipped (either password required in backend/.env or server stopped).');
    console.log('   You can still open database/exports/all_portal_data_mysql.sql in MySQL Workbench anytime!');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 SYNC COMPLETE!');
  console.log(`📊 Statistics fetched from Render:`);
  console.log(`   - Students: ${backupData.students?.length || 0}`);
  console.log(`   - Admins: ${backupData.admins?.length || 0}`);
  console.log(`   - GD Sessions: ${backupData.gd_sessions?.length || 0}`);
  console.log(`   - Assessments: ${backupData.assessments?.length || 0}`);
  console.log(`   - Study Materials: ${backupData.study_materials?.length || 0}`);
  console.log(`   - Audit Logs: ${backupData.audit_logs?.length || 0}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

syncFromRender();
