const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..', '..');
const dbJsonPath = path.join(rootDir, 'database', 'portal.json');
const exportDir = path.join(rootDir, 'database', 'exports');

if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir, { recursive: true });
}

if (!fs.existsSync(dbJsonPath)) {
  console.error('Error: database/portal.json not found at:', dbJsonPath);
  process.exit(1);
}

const raw = fs.readFileSync(dbJsonPath, 'utf8');
const data = JSON.parse(raw);

console.log('📦 Exporting Student Portal Data...');

// 1. Export Complete Master JSON
const masterPath = path.join(exportDir, 'all_portal_data.json');
fs.writeFileSync(masterPath, JSON.stringify(data, null, 2), 'utf8');
console.log(`✅ Saved master backup: database/exports/all_portal_data.json (${(Buffer.byteLength(JSON.stringify(data)) / 1024).toFixed(1)} KB)`);

// 2. Export Individual Collections
const individualExports = [
  { file: 'students.json', data: data.students || [] },
  { file: 'admins.json', data: data.admins || [] },
  { 
    file: 'gd_data.json', 
    data: {
      gd_sessions: data.gd_sessions || [],
      gd_participants: data.gd_participants || [],
      gd_peer_evaluations: data.gd_peer_evaluations || [],
      gd_speaker_ratings: data.gd_speaker_ratings || []
    } 
  },
  {
    file: 'assessments_and_questions.json',
    data: {
      assessments: data.assessments || [],
      assessment_assignments: data.assessment_assignments || [],
      questions: data.questions || [],
      question_pools: data.question_pools || [],
      student_answers: data.student_answers || []
    }
  },
  { file: 'study_materials.json', data: data.study_materials || [] },
  { 
    file: 'attendance_and_meetings.json', 
    data: {
      attendance_sessions: data.attendance_sessions || [],
      attendance_records: data.attendance_records || [],
      meetings: data.meetings || [],
      meeting_settings: data.meeting_settings || []
    }
  },
  { file: 'student_progress.json', data: data.student_progress || [] },
  { file: 'audit_logs.json', data: data.audit_logs || [] }
];

for (const item of individualExports) {
  const filePath = path.join(exportDir, item.file);
  fs.writeFileSync(filePath, JSON.stringify(item.data, null, 2), 'utf8');
  const count = Array.isArray(item.data) ? `${item.data.length} items` : 'structured object';
  console.log(`✅ Exported ${item.file} (${count})`);
}

// 3. Export Comprehensive PostgreSQL SQL Script (all_portal_data.sql)
// Generates PostgreSQL table creation and both JSON storage & relational inserts
function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return "'" + String(str).replace(/'/g, "''") + "'";
}

let sql = `-- =========================================================================
-- STUDENT PORTAL COMPLETE DATABASE EXPORT & RESTORE SCRIPT
-- Generated: ${new Date().toISOString()}
-- Compatible with: PostgreSQL 12+, Render, Supabase, Neon, AWS RDS, Local PG
-- =========================================================================

BEGIN;

-- 1. Portal State Table (used by the active Backend application)
CREATE TABLE IF NOT EXISTS portal_storage (
  key VARCHAR(64) PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert or update the full portal state JSON
INSERT INTO portal_storage (key, data, updated_at)
VALUES (
  'portal_state',
  ${escapeSql(JSON.stringify(data))}::jsonb,
  CURRENT_TIMESTAMP
)
ON CONFLICT (key) DO UPDATE
SET data = EXCLUDED.data, updated_at = CURRENT_TIMESTAMP;

-- 2. Relational Admins Table
CREATE TABLE IF NOT EXISTS admins (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(64) NOT NULL DEFAULT 'ADMIN',
  department VARCHAR(255) NOT NULL,
  is_super_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

`;

if (data.admins && data.admins.length > 0) {
  for (const a of data.admins) {
    sql += `INSERT INTO admins (id, name, email, password, role, department, is_super_admin, created_at)\n` +
      `VALUES (${escapeSql(a.id)}, ${escapeSql(a.name)}, ${escapeSql(a.email)}, ${escapeSql(a.password)}, ` +
      `${escapeSql(a.role)}, ${escapeSql(a.department)}, ${a.is_super_admin ? 'TRUE' : 'FALSE'}, ${escapeSql(a.created_at || new Date().toISOString())})\n` +
      `ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, password = EXCLUDED.password;\n`;
  }
}

sql += `\n-- 3. Relational Students Table
CREATE TABLE IF NOT EXISTS students (
  id VARCHAR(64) PRIMARY KEY,
  student_id VARCHAR(64) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  department VARCHAR(64) NOT NULL,
  year INTEGER NOT NULL,
  community VARCHAR(255) NOT NULL,
  skill_level VARCHAR(64) NOT NULL,
  profile TEXT,
  interest TEXT,
  suggested_role VARCHAR(255),
  status VARCHAR(64) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

`;

if (data.students && data.students.length > 0) {
  for (const s of data.students) {
    sql += `INSERT INTO students (id, student_id, name, email, password, department, year, community, skill_level, profile, interest, suggested_role, status, created_at)\n` +
      `VALUES (${escapeSql(s.id)}, ${escapeSql(s.student_id)}, ${escapeSql(s.name)}, ${escapeSql(s.email)}, ${escapeSql(s.password || s.student_id || 'student123')}, ` +
      `${escapeSql(s.department)}, ${Number(s.year) || 1}, ${escapeSql(s.community)}, ${escapeSql(s.skill_level)}, ` +
      `${escapeSql(s.profile)}, ${escapeSql(s.interest)}, ${escapeSql(s.suggested_role)}, ${escapeSql(s.status || 'ACTIVE')}, ${escapeSql(s.created_at || new Date().toISOString())})\n` +
      `ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, password = EXCLUDED.password;\n`;
  }
}

sql += `\n-- 4. Relational GD Sessions Table
CREATE TABLE IF NOT EXISTS gd_sessions (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  topic TEXT NOT NULL,
  guidelines TEXT,
  target_community VARCHAR(255),
  department VARCHAR(64),
  date DATE,
  start_time VARCHAR(32),
  duration_minutes INTEGER,
  time_per_candidate_seconds INTEGER DEFAULT 180,
  max_participants INTEGER DEFAULT 10,
  min_evaluators_per_candidate INTEGER DEFAULT 3,
  evaluation_criteria JSONB,
  status VARCHAR(64) DEFAULT 'UPCOMING',
  created_by VARCHAR(64),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

`;

if (data.gd_sessions && data.gd_sessions.length > 0) {
  for (const gd of data.gd_sessions) {
    sql += `INSERT INTO gd_sessions (id, title, topic, guidelines, target_community, department, date, start_time, duration_minutes, time_per_candidate_seconds, max_participants, min_evaluators_per_candidate, evaluation_criteria, status, created_by, created_at)\n` +
      `VALUES (${escapeSql(gd.id)}, ${escapeSql(gd.title)}, ${escapeSql(gd.topic)}, ${escapeSql(gd.guidelines)}, ${escapeSql(gd.target_community)}, ` +
      `${escapeSql(gd.department)}, ${escapeSql(gd.date)}, ${escapeSql(gd.start_time)}, ${Number(gd.duration_minutes) || 30}, ` +
      `${Number(gd.time_per_candidate_seconds) || 180}, ${Number(gd.max_participants) || 10}, ${Number(gd.min_evaluators_per_candidate) || 3}, ` +
      `${escapeSql(JSON.stringify(gd.evaluation_criteria || []))}::jsonb, ${escapeSql(gd.status)}, ${escapeSql(gd.created_by)}, ${escapeSql(gd.created_at || new Date().toISOString())})\n` +
      `ON CONFLICT (id) DO NOTHING;\n`;
  }
}

sql += `\n-- 5. Relational GD Participants Table
CREATE TABLE IF NOT EXISTS gd_participants (
  id VARCHAR(64) PRIMARY KEY,
  gd_session_id VARCHAR(64) NOT NULL,
  student_id VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  roll_number VARCHAR(64) NOT NULL,
  email VARCHAR(255) NOT NULL,
  department VARCHAR(64),
  speaking_order INTEGER DEFAULT 1,
  speaking_status VARCHAR(64) DEFAULT 'PENDING',
  total_speaking_duration_seconds INTEGER DEFAULT 0,
  speaking_turns_count INTEGER DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

`;

if (data.gd_participants && data.gd_participants.length > 0) {
  for (const gp of data.gd_participants) {
    const sId = gp.session_id || gp.gd_session_id;
    const sName = gp.student_name || gp.name || 'Student';
    const sReg = gp.student_reg || gp.roll_number || 'N/A';
    const sEmail = gp.email || `${sReg}@college.edu`;
    const sDept = gp.student_department || gp.department || 'ALL';
    sql += `INSERT INTO gd_participants (id, gd_session_id, student_id, name, roll_number, email, department, speaking_order, speaking_status, total_speaking_duration_seconds, speaking_turns_count, joined_at)\n` +
      `VALUES (${escapeSql(gp.id)}, ${escapeSql(sId)}, ${escapeSql(gp.student_id)}, ${escapeSql(sName)}, ${escapeSql(sReg)}, ` +
      `${escapeSql(sEmail)}, ${escapeSql(sDept)}, ${Number(gp.speaking_order) || 1}, ${escapeSql(gp.speaking_status || 'PENDING')}, ` +
      `${Number(gp.speaking_time_seconds || gp.total_speaking_duration_seconds) || 0}, ${Number(gp.speaking_turns_count) || 0}, ${escapeSql(gp.joined_at || new Date().toISOString())})\n` +
      `ON CONFLICT (id) DO NOTHING;\n`;
  }
}

sql += `\nCOMMIT;\n`;

const sqlPath = path.join(exportDir, 'all_portal_data.sql');
fs.writeFileSync(sqlPath, sql, 'utf8');
console.log(`✅ Saved PostgreSQL SQL dump: database/exports/all_portal_data.sql (${(Buffer.byteLength(sql) / 1024).toFixed(1)} KB)`);

// 4. Write README in database/exports
const readmeContent = `# Student Portal Database Exports

This directory contains standalone, portable exports of all portal data.

## Files Overview

1. **\`all_portal_data.json\`**
   - The master JSON file containing all collections (admins, students, GD sessions, participants, assessments, questions, materials, audit logs).
   - Can be directly loaded into the portal backend or restored via the Admin Dashboard.

2. **\`all_portal_data.sql\`**
   - Ready-to-run PostgreSQL SQL script.
   - Populates both the active application \`portal_storage\` table and relational tables (\`admins\`, \`students\`, \`gd_sessions\`, \`gd_participants\`).
   - Run in any PostgreSQL instance: \`psql "<DATABASE_URL>" -f database/exports/all_portal_data.sql\`

3. **\`students.json\`**
   - Contains all 25 enrolled students with IDs, roll numbers, credentials, communities, and levels.

4. **\`admins.json\`**
   - Contains all portal administrator accounts.

5. **\`gd_data.json\`**
   - Contains Group Discussion sessions, candidate limits, turn-based speaking orders, and participant records.

6. **\`assessments_and_questions.json\`**
   - Contains assessments, question banks, and questions.

7. **\`study_materials.json\`**
   - Contains all published study materials and resources.

## How to Import into PostgreSQL

Run the import script:
\`\`\`bash
node backend/scripts/import_to_postgres.js "<YOUR_POSTGRES_DATABASE_URL>"
\`\`\`
Or execute the SQL dump directly:
\`\`\`bash
psql "<YOUR_POSTGRES_DATABASE_URL>" -f database/exports/all_portal_data.sql
\`\`\`
`;

fs.writeFileSync(path.join(exportDir, 'README.md'), readmeContent, 'utf8');
console.log('✅ Generated database/exports/README.md documentation.');
console.log('🎉 Data collection & export completed successfully!');
