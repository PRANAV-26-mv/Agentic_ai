const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const rootDir = path.resolve(__dirname, '..', '..');
const dbJsonPath = path.join(rootDir, 'database', 'portal.json');

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
  console.log('    npm --prefix backend run restore-render "https://YOUR-ACTUAL-APP.onrender.com"');
  console.log('');
  console.log('  Option B: Put your real URL in backend/.env on line 20:');
  console.log('    RENDER_URL=https://YOUR-ACTUAL-APP.onrender.com');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  process.exit(1);
}

renderUrl = renderUrl.trim().replace(/\/+$/, '');

if (!fs.existsSync(dbJsonPath)) {
  console.error(`❌ Local database not found at: ${dbJsonPath}`);
  process.exit(1);
}

const localData = JSON.parse(fs.readFileSync(dbJsonPath, 'utf8'));

async function restoreToRender() {
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

  // 2. Push local data to Render restore endpoint
  console.log(`📤 Uploading and restoring local database to Render (${localData.students?.length || 0} students, ${localData.admins?.length || 0} admins)...`);

  try {
    const restoreRes = await fetch(`${renderUrl}/api/admins/database/restore`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(localData)
    });

    const resJson = await restoreRes.json();
    if (!restoreRes.ok) {
      console.error('❌ Restore failed on Render:', resJson.message || restoreRes.statusText);
      process.exit(1);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 RESTORE SUCCESSFUL!');
    console.log('🚀 Your live Render website has been completely restored from your local data!');
    console.log(`📊 Current live counts:`);
    console.log(`   - Students: ${localData.students?.length || 0}`);
    console.log(`   - Admins: ${localData.admins?.length || 0}`);
    console.log(`   - GD Sessions: ${localData.gd_sessions?.length || 0}`);
    console.log(`   - Assessments: ${localData.assessments?.length || 0}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (err) {
    console.error('❌ Failed to push data to Render:', err.message);
    process.exit(1);
  }
}

restoreToRender();
