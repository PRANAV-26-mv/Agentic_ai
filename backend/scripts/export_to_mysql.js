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

console.log('🐬 Generating Comprehensive MySQL SQL Script for MySQL Workbench...');

function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  const clean = String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  return `'${clean}'`;
}

function formatDate(dateStr) {
  if (!dateStr) return 'NULL';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return escapeSql(dateStr);
    return `'${d.toISOString().slice(0, 19).replace('T', ' ')}'`;
  } catch {
    return escapeSql(dateStr);
  }
}

let sql = `-- =========================================================================
-- STUDENT PORTAL COMPLETE MYSQL WORKBENCH IMPORT SCRIPT
-- Generated: ${new Date().toISOString()}
-- Compatible with: MySQL 5.7+, MySQL 8.0+, MariaDB 10.3+, MySQL Workbench
-- =========================================================================

CREATE DATABASE IF NOT EXISTS \`student_portal\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`student_portal\`;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Portal Storage (Complete JSON snapshot used by the Node backend application)
CREATE TABLE IF NOT EXISTS \`portal_storage\` (
  \`key\` VARCHAR(64) PRIMARY KEY,
  \`data\` LONGTEXT NOT NULL,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO \`portal_storage\` (\`key\`, \`data\`, \`updated_at\`)
VALUES ('portal_state', ${escapeSql(JSON.stringify(data))}, NOW())
ON DUPLICATE KEY UPDATE \`data\` = VALUES(\`data\`), \`updated_at\` = NOW();

-- 2. Admins Table
CREATE TABLE IF NOT EXISTS \`admins\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`name\` VARCHAR(255) NOT NULL,
  \`email\` VARCHAR(255) UNIQUE NOT NULL,
  \`password\` VARCHAR(255) NOT NULL,
  \`role\` VARCHAR(64) NOT NULL DEFAULT 'ADMIN',
  \`department\` VARCHAR(255) NOT NULL,
  \`is_super_admin\` TINYINT(1) DEFAULT 0,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

`;

if (data.admins && data.admins.length > 0) {
  for (const a of data.admins) {
    sql += `INSERT INTO \`admins\` (\`id\`, \`name\`, \`email\`, \`password\`, \`role\`, \`department\`, \`is_super_admin\`, \`created_at\`)\n` +
      `VALUES (${escapeSql(a.id)}, ${escapeSql(a.name)}, ${escapeSql(a.email)}, ${escapeSql(a.password)}, ` +
      `${escapeSql(a.role)}, ${escapeSql(a.department)}, ${a.is_super_admin ? 1 : 0}, ${formatDate(a.created_at)})\n` +
      `ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`), \`email\` = VALUES(\`email\`), \`password\` = VALUES(\`password\`);\n`;
  }
}

sql += `\n-- 3. Students Table
CREATE TABLE IF NOT EXISTS \`students\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`student_id\` VARCHAR(64) UNIQUE NOT NULL,
  \`name\` VARCHAR(255) NOT NULL,
  \`email\` VARCHAR(255) UNIQUE NOT NULL,
  \`password\` VARCHAR(255) NOT NULL,
  \`department\` VARCHAR(64) NOT NULL,
  \`year\` INT NOT NULL,
  \`community\` VARCHAR(255) NOT NULL,
  \`skill_level\` VARCHAR(64) NOT NULL,
  \`profile\` TEXT,
  \`interest\` TEXT,
  \`suggested_role\` VARCHAR(255),
  \`status\` VARCHAR(64) NOT NULL DEFAULT 'ACTIVE',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

`;

if (data.students && data.students.length > 0) {
  for (const s of data.students) {
    sql += `INSERT INTO \`students\` (\`id\`, \`student_id\`, \`name\`, \`email\`, \`password\`, \`department\`, \`year\`, \`community\`, \`skill_level\`, \`profile\`, \`interest\`, \`suggested_role\`, \`status\`, \`created_at\`)\n` +
      `VALUES (${escapeSql(s.id)}, ${escapeSql(s.student_id)}, ${escapeSql(s.name)}, ${escapeSql(s.email)}, ${escapeSql(s.password)}, ` +
      `${escapeSql(s.department)}, ${Number(s.year) || 1}, ${escapeSql(s.community)}, ${escapeSql(s.skill_level)}, ` +
      `${escapeSql(s.profile)}, ${escapeSql(s.interest)}, ${escapeSql(s.suggested_role)}, ${escapeSql(s.status || 'ACTIVE')}, ${formatDate(s.created_at)})\n` +
      `ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`), \`email\` = VALUES(\`email\`), \`password\` = VALUES(\`password\`);\n`;
  }
}

sql += `\n-- 4. GD Sessions Table
CREATE TABLE IF NOT EXISTS \`gd_sessions\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`title\` VARCHAR(255) NOT NULL,
  \`topic\` TEXT NOT NULL,
  \`description\` TEXT,
  \`pin\` VARCHAR(32),
  \`guidelines\` TEXT,
  \`target_community\` VARCHAR(255),
  \`department\` VARCHAR(64),
  \`date\` VARCHAR(32),
  \`start_time\` VARCHAR(32),
  \`duration_minutes\` INT,
  \`time_per_candidate_seconds\` INT DEFAULT 180,
  \`max_participants\` INT DEFAULT 10,
  \`min_evaluators_per_candidate\` INT DEFAULT 3,
  \`evaluation_criteria\` JSON,
  \`speaker_duration_limit_seconds\` INT DEFAULT 120,
  \`status\` VARCHAR(64) DEFAULT 'UPCOMING',
  \`created_by\` VARCHAR(64),
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

`;

if (data.gd_sessions && data.gd_sessions.length > 0) {
  for (const gd of data.gd_sessions) {
    sql += `INSERT INTO \`gd_sessions\` (\`id\`, \`title\`, \`topic\`, \`description\`, \`pin\`, \`guidelines\`, \`target_community\`, \`department\`, \`date\`, \`start_time\`, \`duration_minutes\`, \`time_per_candidate_seconds\`, \`max_participants\`, \`min_evaluators_per_candidate\`, \`evaluation_criteria\`, \`speaker_duration_limit_seconds\`, \`status\`, \`created_by\`, \`created_at\`)\n` +
      `VALUES (${escapeSql(gd.id)}, ${escapeSql(gd.title)}, ${escapeSql(gd.topic)}, ${escapeSql(gd.description)}, ${escapeSql(gd.pin)}, ${escapeSql(gd.guidelines)}, ${escapeSql(gd.target_community)}, ` +
      `${escapeSql(gd.department)}, ${escapeSql(gd.date)}, ${escapeSql(gd.start_time)}, ${Number(gd.duration_minutes) || 30}, ` +
      `${Number(gd.time_per_candidate_seconds) || 180}, ${Number(gd.max_participants) || 10}, ${Number(gd.min_evaluators_per_candidate) || 3}, ` +
      `${escapeSql(JSON.stringify(gd.evaluation_criteria || []))}, ${Number(gd.speaker_duration_limit_seconds) || 120}, ${escapeSql(gd.status)}, ${escapeSql(gd.created_by)}, ${formatDate(gd.created_at)})\n` +
      `ON DUPLICATE KEY UPDATE \`title\` = VALUES(\`title\`), \`topic\` = VALUES(\`topic\`);\n`;
  }
}

sql += `\n-- 5. GD Participants Table (Using backticks for reserved keyword 'rank')
CREATE TABLE IF NOT EXISTS \`gd_participants\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`session_id\` VARCHAR(64) NOT NULL,
  \`student_id\` VARCHAR(64) NOT NULL,
  \`student_name\` VARCHAR(255) NOT NULL,
  \`student_reg\` VARCHAR(64) NOT NULL,
  \`student_department\` VARCHAR(64),
  \`student_community\` VARCHAR(255),
  \`speaking_order\` INT DEFAULT 1,
  \`speaking_status\` VARCHAR(64) DEFAULT 'PENDING',
  \`speaking_time_seconds\` INT DEFAULT 0,
  \`rank\` INT DEFAULT 0,
  \`total_points\` FLOAT DEFAULT 0,
  \`joined_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

`;

if (data.gd_participants && data.gd_participants.length > 0) {
  for (const gp of data.gd_participants) {
    sql += `INSERT INTO \`gd_participants\` (\`id\`, \`session_id\`, \`student_id\`, \`student_name\`, \`student_reg\`, \`student_department\`, \`student_community\`, \`speaking_order\`, \`speaking_status\`, \`speaking_time_seconds\`, \`rank\`, \`total_points\`, \`joined_at\`)\n` +
      `VALUES (${escapeSql(gp.id)}, ${escapeSql(gp.session_id)}, ${escapeSql(gp.student_id)}, ${escapeSql(gp.student_name)}, ${escapeSql(gp.student_reg)}, ` +
      `${escapeSql(gp.student_department)}, ${escapeSql(gp.student_community)}, ${Number(gp.speaking_order) || 1}, ${escapeSql(gp.speaking_status || 'PENDING')}, ` +
      `${Number(gp.speaking_time_seconds) || 0}, ${Number(gp.rank) || 0}, ${Number(gp.total_points) || 0}, ${formatDate(gp.joined_at)})\n` +
      `ON DUPLICATE KEY UPDATE \`student_name\` = VALUES(\`student_name\`);\n`;
  }
}

sql += `\n-- 6. Assessments Table
CREATE TABLE IF NOT EXISTS \`assessments\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`title\` VARCHAR(255) NOT NULL,
  \`description\` TEXT,
  \`type\` VARCHAR(64) NOT NULL,
  \`question_selection_mode\` VARCHAR(64) NOT NULL DEFAULT 'FIXED',
  \`community\` VARCHAR(255),
  \`department\` VARCHAR(255),
  \`target_type\` VARCHAR(64) NOT NULL DEFAULT 'ALL',
  \`duration_minutes\` INT NOT NULL,
  \`start_time\` DATETIME,
  \`end_time\` DATETIME,
  \`passing_percentage\` FLOAT NOT NULL,
  \`max_marks\` FLOAT NOT NULL,
  \`status\` VARCHAR(64) NOT NULL DEFAULT 'DRAFT',
  \`created_by\` VARCHAR(64),
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

`;

if (data.assessments && data.assessments.length > 0) {
  for (const a of data.assessments) {
    sql += `INSERT INTO \`assessments\` (\`id\`, \`title\`, \`description\`, \`type\`, \`question_selection_mode\`, \`community\`, \`department\`, \`target_type\`, \`duration_minutes\`, \`start_time\`, \`end_time\`, \`passing_percentage\`, \`max_marks\`, \`status\`, \`created_by\`, \`created_at\`)\n` +
      `VALUES (${escapeSql(a.id)}, ${escapeSql(a.title)}, ${escapeSql(a.description)}, ${escapeSql(a.type)}, ` +
      `${escapeSql(a.question_selection_mode)}, ${escapeSql(a.community)}, ${escapeSql(a.department)}, ${escapeSql(a.target_type)}, ` +
      `${Number(a.duration_minutes) || 30}, ${formatDate(a.start_time)}, ${formatDate(a.end_time)}, ` +
      `${Number(a.passing_percentage) || 50}, ${Number(a.max_marks) || 100}, ${escapeSql(a.status)}, ${escapeSql(a.created_by)}, ${formatDate(a.created_at)})\n` +
      `ON DUPLICATE KEY UPDATE \`title\` = VALUES(\`title\`);\n`;
  }
}

sql += `\n-- 7. Questions Table
CREATE TABLE IF NOT EXISTS \`questions\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`source_pdf_id\` VARCHAR(64),
  \`question_type\` VARCHAR(64) NOT NULL,
  \`question_text\` TEXT NOT NULL,
  \`option_a\` TEXT,
  \`option_b\` TEXT,
  \`option_c\` TEXT,
  \`option_d\` TEXT,
  \`correct_answer\` TEXT,
  \`explanation\` TEXT,
  \`rubric\` TEXT,
  \`expected_answer\` TEXT,
  \`marks\` FLOAT NOT NULL DEFAULT 1,
  \`difficulty\` VARCHAR(64) NOT NULL DEFAULT 'Medium',
  \`topic\` VARCHAR(255),
  \`status\` VARCHAR(64) NOT NULL DEFAULT 'APPROVED',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

`;

if (data.questions && data.questions.length > 0) {
  for (const q of data.questions) {
    sql += `INSERT INTO \`questions\` (\`id\`, \`source_pdf_id\`, \`question_type\`, \`question_text\`, \`option_a\`, \`option_b\`, \`option_c\`, \`option_d\`, \`correct_answer\`, \`explanation\`, \`rubric\`, \`expected_answer\`, \`marks\`, \`difficulty\`, \`topic\`, \`status\`, \`created_at\`)\n` +
      `VALUES (${escapeSql(q.id)}, ${escapeSql(q.source_pdf_id)}, ${escapeSql(q.question_type)}, ${escapeSql(q.question_text)}, ` +
      `${escapeSql(q.option_a)}, ${escapeSql(q.option_b)}, ${escapeSql(q.option_c)}, ${escapeSql(q.option_d)}, ` +
      `${escapeSql(q.correct_answer)}, ${escapeSql(q.explanation)}, ${escapeSql(q.rubric)}, ${escapeSql(q.expected_answer)}, ` +
      `${Number(q.marks) || 1}, ${escapeSql(q.difficulty)}, ${escapeSql(q.topic)}, ${escapeSql(q.status)}, ${formatDate(q.created_at)})\n` +
      `ON DUPLICATE KEY UPDATE \`question_text\` = VALUES(\`question_text\`);\n`;
  }
}

sql += `\n-- 8. Question Pools Table
CREATE TABLE IF NOT EXISTS \`question_pools\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`name\` VARCHAR(255) NOT NULL,
  \`description\` TEXT,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

`;

if (data.question_pools && data.question_pools.length > 0) {
  for (const p of data.question_pools) {
    sql += `INSERT INTO \`question_pools\` (\`id\`, \`name\`, \`description\`, \`created_at\`)\n` +
      `VALUES (${escapeSql(p.id)}, ${escapeSql(p.name)}, ${escapeSql(p.description)}, ${formatDate(p.created_at)})\n` +
      `ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`);\n`;
  }
}

sql += `\n-- 9. Study Materials Table
CREATE TABLE IF NOT EXISTS \`study_materials\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`title\` VARCHAR(255) NOT NULL,
  \`description\` TEXT,
  \`material_type\` VARCHAR(64) NOT NULL,
  \`file_url\` TEXT NOT NULL,
  \`page_count\` INT,
  \`target_type\` VARCHAR(64) NOT NULL DEFAULT 'ALL',
  \`target_department\` VARCHAR(255),
  \`target_community\` VARCHAR(255),
  \`published_date\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`created_by\` VARCHAR(64)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

`;

if (data.study_materials && data.study_materials.length > 0) {
  for (const m of data.study_materials) {
    sql += `INSERT INTO \`study_materials\` (\`id\`, \`title\`, \`description\`, \`material_type\`, \`file_url\`, \`page_count\`, \`target_type\`, \`target_department\`, \`target_community\`, \`published_date\`, \`created_by\`)\n` +
      `VALUES (${escapeSql(m.id)}, ${escapeSql(m.title)}, ${escapeSql(m.description)}, ${escapeSql(m.material_type)}, ` +
      `${escapeSql(m.file_url)}, ${Number(m.page_count) || 0}, ${escapeSql(m.target_type)}, ${escapeSql(m.target_department)}, ` +
      `${escapeSql(m.target_community)}, ${formatDate(m.published_date)}, ${escapeSql(m.created_by)})\n` +
      `ON DUPLICATE KEY UPDATE \`title\` = VALUES(\`title\`);\n`;
  }
}

sql += `\n-- 10. Attendance Sessions Table
CREATE TABLE IF NOT EXISTS \`attendance_sessions\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`community\` VARCHAR(255),
  \`department\` VARCHAR(255),
  \`date\` VARCHAR(32) NOT NULL,
  \`code\` VARCHAR(32) NOT NULL,
  \`start_time\` DATETIME,
  \`expires_at\` DATETIME,
  \`created_by\` VARCHAR(64)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

`;

if (data.attendance_sessions && data.attendance_sessions.length > 0) {
  for (const att of data.attendance_sessions) {
    sql += `INSERT INTO \`attendance_sessions\` (\`id\`, \`community\`, \`department\`, \`date\`, \`code\`, \`start_time\`, \`expires_at\`, \`created_by\`)\n` +
      `VALUES (${escapeSql(att.id)}, ${escapeSql(att.community)}, ${escapeSql(att.department)}, ${escapeSql(att.date)}, ` +
      `${escapeSql(att.code)}, ${formatDate(att.start_time)}, ${formatDate(att.expires_at)}, ${escapeSql(att.created_by)})\n` +
      `ON DUPLICATE KEY UPDATE \`code\` = VALUES(\`code\`);\n`;
  }
}

sql += `\n-- 11. Attendance Records Table
CREATE TABLE IF NOT EXISTS \`attendance_records\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`session_id\` VARCHAR(64) NOT NULL,
  \`student_id\` VARCHAR(64) NOT NULL,
  \`marked_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`status\` VARCHAR(64) NOT NULL DEFAULT 'PRESENT',
  UNIQUE KEY \`unique_session_student\` (\`session_id\`, \`student_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

`;

if (data.attendance_records && data.attendance_records.length > 0) {
  for (const ar of data.attendance_records) {
    sql += `INSERT INTO \`attendance_records\` (\`id\`, \`session_id\`, \`student_id\`, \`marked_at\`, \`status\`)\n` +
      `VALUES (${escapeSql(ar.id)}, ${escapeSql(ar.session_id)}, ${escapeSql(ar.student_id)}, ${formatDate(ar.marked_at)}, ${escapeSql(ar.status || 'PRESENT')})\n` +
      `ON DUPLICATE KEY UPDATE \`status\` = VALUES(\`status\`);\n`;
  }
}

sql += `\n-- 12. Notifications Table
CREATE TABLE IF NOT EXISTS \`notifications\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`title\` VARCHAR(255) NOT NULL,
  \`message\` TEXT NOT NULL,
  \`target_type\` VARCHAR(64) NOT NULL DEFAULT 'ALL',
  \`priority\` VARCHAR(64) NOT NULL DEFAULT 'NORMAL',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

`;

if (data.notifications && data.notifications.length > 0) {
  for (const n of data.notifications) {
    sql += `INSERT INTO \`notifications\` (\`id\`, \`title\`, \`message\`, \`target_type\`, \`priority\`, \`created_at\`)\n` +
      `VALUES (${escapeSql(n.id)}, ${escapeSql(n.title)}, ${escapeSql(n.message)}, ${escapeSql(n.target_type)}, ` +
      `${escapeSql(n.priority)}, ${formatDate(n.created_at)})\n` +
      `ON DUPLICATE KEY UPDATE \`title\` = VALUES(\`title\`);\n`;
  }
}

sql += `\n-- 13. Meetings Table
CREATE TABLE IF NOT EXISTS \`meetings\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`code\` VARCHAR(64) NOT NULL,
  \`title\` VARCHAR(255) NOT NULL,
  \`description\` TEXT,
  \`host_id\` VARCHAR(64),
  \`host_name\` VARCHAR(255),
  \`host_email\` VARCHAR(255),
  \`meeting_type\` VARCHAR(64) DEFAULT 'VIDEO_VOICE',
  \`audience_type\` VARCHAR(64) DEFAULT 'ALL_STUDENTS',
  \`status\` VARCHAR(64) DEFAULT 'ACTIVE',
  \`scheduled_start_time\` DATETIME,
  \`actual_start_time\` DATETIME,
  \`external_link\` TEXT,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

`;

if (data.meetings && data.meetings.length > 0) {
  for (const m of data.meetings) {
    sql += `INSERT INTO \`meetings\` (\`id\`, \`code\`, \`title\`, \`description\`, \`host_id\`, \`host_name\`, \`host_email\`, \`meeting_type\`, \`audience_type\`, \`status\`, \`scheduled_start_time\`, \`actual_start_time\`, \`external_link\`, \`created_at\`)\n` +
      `VALUES (${escapeSql(m.id)}, ${escapeSql(m.code)}, ${escapeSql(m.title)}, ${escapeSql(m.description)}, ` +
      `${escapeSql(m.host_id)}, ${escapeSql(m.host_name)}, ${escapeSql(m.host_email)}, ${escapeSql(m.meeting_type)}, ` +
      `${escapeSql(m.audience_type)}, ${escapeSql(m.status)}, ${formatDate(m.scheduled_start_time)}, ${formatDate(m.actual_start_time)}, ` +
      `${escapeSql(m.external_link)}, ${formatDate(m.created_at)})\n` +
      `ON DUPLICATE KEY UPDATE \`title\` = VALUES(\`title\`);\n`;
  }
}

sql += `\n-- 14. Quiz Sessions Table
CREATE TABLE IF NOT EXISTS \`quiz_sessions\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`title\` VARCHAR(255) NOT NULL,
  \`description\` TEXT,
  \`pin\` VARCHAR(32) NOT NULL,
  \`target_type\` VARCHAR(64) DEFAULT 'ALL',
  \`duration_minutes\` INT DEFAULT 15,
  \`status\` VARCHAR(64) DEFAULT 'ACTIVE',
  \`created_by\` VARCHAR(64),
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

`;

if (data.quiz_sessions && data.quiz_sessions.length > 0) {
  for (const qs of data.quiz_sessions) {
    sql += `INSERT INTO \`quiz_sessions\` (\`id\`, \`title\`, \`description\`, \`pin\`, \`target_type\`, \`duration_minutes\`, \`status\`, \`created_by\`, \`created_at\`)\n` +
      `VALUES (${escapeSql(qs.id)}, ${escapeSql(qs.title)}, ${escapeSql(qs.description)}, ${escapeSql(qs.pin)}, ` +
      `${escapeSql(qs.target_type)}, ${Number(qs.duration_minutes) || 15}, ${escapeSql(qs.status)}, ${escapeSql(qs.created_by)}, ${formatDate(qs.created_at)})\n` +
      `ON DUPLICATE KEY UPDATE \`title\` = VALUES(\`title\`);\n`;
  }
}

sql += `\n-- 15. Student Progress Table
CREATE TABLE IF NOT EXISTS \`student_progress\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`student_id\` VARCHAR(64) UNIQUE NOT NULL,
  \`materials_viewed_count\` INT DEFAULT 0,
  \`assessments_completed_count\` INT DEFAULT 0,
  \`avg_score\` FLOAT DEFAULT 0,
  \`attendance_pct\` FLOAT DEFAULT 0,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

`;

if (data.student_progress && data.student_progress.length > 0) {
  for (const sp of data.student_progress) {
    sql += `INSERT INTO \`student_progress\` (\`id\`, \`student_id\`, \`materials_viewed_count\`, \`assessments_completed_count\`, \`avg_score\`, \`attendance_pct\`, \`updated_at\`)\n` +
      `VALUES (${escapeSql(sp.id)}, ${escapeSql(sp.student_id)}, ${Number(sp.materials_viewed_count) || 0}, ` +
      `${Number(sp.assessments_completed_count) || 0}, ${Number(sp.avg_score) || 0}, ${Number(sp.attendance_pct) || 0}, ${formatDate(sp.updated_at)})\n` +
      `ON DUPLICATE KEY UPDATE \`student_id\` = VALUES(\`student_id\`);\n`;
  }
}

sql += `\n-- 16. Audit Logs Table
CREATE TABLE IF NOT EXISTS \`audit_logs\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`actor_id\` VARCHAR(64) NOT NULL,
  \`actor_role\` VARCHAR(64) NOT NULL,
  \`action\` VARCHAR(255) NOT NULL,
  \`entity_type\` VARCHAR(255) NOT NULL,
  \`entity_id\` VARCHAR(255),
  \`metadata\` TEXT,
  \`timestamp\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

`;

if (data.audit_logs && data.audit_logs.length > 0) {
  for (const log of data.audit_logs) {
    sql += `INSERT INTO \`audit_logs\` (\`id\`, \`actor_id\`, \`actor_role\`, \`action\`, \`entity_type\`, \`entity_id\`, \`metadata\`, \`timestamp\`)\n` +
      `VALUES (${escapeSql(log.id)}, ${escapeSql(log.actor_id)}, ${escapeSql(log.actor_role)}, ${escapeSql(log.action)}, ` +
      `${escapeSql(log.entity_type)}, ${escapeSql(log.entity_id)}, ${escapeSql(log.metadata ? JSON.stringify(log.metadata) : null)}, ${formatDate(log.timestamp)})\n` +
      `ON DUPLICATE KEY UPDATE \`id\` = VALUES(\`id\`);\n`;
  }
}

sql += `\nSET FOREIGN_KEY_CHECKS = 1;\n`;

const outPath = path.join(exportDir, 'all_portal_data_mysql.sql');
fs.writeFileSync(outPath, sql, 'utf8');

console.log(`✅ Successfully generated MySQL script: database/exports/all_portal_data_mysql.sql (${(Buffer.byteLength(sql) / 1024).toFixed(1)} KB)`);
