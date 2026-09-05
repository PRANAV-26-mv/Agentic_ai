-- Database Schema for Student Assessment & Learning Portal v2

CREATE TABLE IF NOT EXISTS admins (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'ADMIN',
  department TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  student_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  department TEXT NOT NULL,
  year INTEGER NOT NULL,
  community TEXT NOT NULL,
  skill_level TEXT NOT NULL,
  profile TEXT,
  interest TEXT,
  suggested_role TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assessments (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- 'MCQ', 'WRITING', 'HYBRID'
  question_selection_mode TEXT NOT NULL DEFAULT 'FIXED', -- 'FIXED', 'RANDOMIZED_POOL'
  community TEXT,
  department TEXT,
  target_type TEXT NOT NULL DEFAULT 'ALL', -- 'ALL', 'COMMUNITY', 'DEPARTMENT', 'SELECTED'
  duration_minutes INTEGER NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  passing_percentage REAL NOT NULL,
  max_marks REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT', -- 'DRAFT', 'PUBLISHED', 'ARCHIVED'
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assessment_assignments (
  id TEXT PRIMARY KEY,
  assessment_id TEXT NOT NULL,
  target_student_id TEXT,
  target_department TEXT,
  target_community TEXT,
  FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  source_pdf_id TEXT,
  question_type TEXT NOT NULL, -- 'MCQ', 'WRITING'
  question_text TEXT NOT NULL,
  option_a TEXT,
  option_b TEXT,
  option_c TEXT,
  option_d TEXT,
  correct_answer TEXT,
  explanation TEXT,
  rubric TEXT,
  expected_answer TEXT,
  marks REAL NOT NULL DEFAULT 1,
  difficulty TEXT NOT NULL DEFAULT 'Medium', -- 'Easy', 'Medium', 'Hard'
  topic TEXT,
  status TEXT NOT NULL DEFAULT 'APPROVED', -- 'DRAFT', 'REVIEW', 'APPROVED', 'REJECTED'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS question_options (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL,
  option_label TEXT NOT NULL,
  option_text TEXT NOT NULL,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS question_pools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS question_pool_items (
  pool_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  PRIMARY KEY (pool_id, question_id),
  FOREIGN KEY (pool_id) REFERENCES question_pools(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS assessment_questions (
  assessment_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  PRIMARY KEY (assessment_id, question_id),
  FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS assessment_attempts (
  id TEXT PRIMARY KEY,
  assessment_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  started_at DATETIME NOT NULL,
  expires_at DATETIME NOT NULL,
  submitted_at DATETIME,
  status TEXT NOT NULL DEFAULT 'IN_PROGRESS', -- 'IN_PROGRESS', 'COMPLETED', 'AUTO_SUBMITTED', 'EXPIRED'
  mcq_score REAL DEFAULT 0,
  writing_score REAL DEFAULT 0,
  total_score REAL DEFAULT 0,
  percentage REAL DEFAULT 0,
  tab_switches_count INTEGER DEFAULT 0,
  assigned_questions_json TEXT,
  FOREIGN KEY (assessment_id) REFERENCES assessments(id),
  FOREIGN KEY (student_id) REFERENCES students(id)
);

CREATE TABLE IF NOT EXISTS student_answers (
  id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  student_answer TEXT,
  selected_option TEXT,
  is_correct INTEGER, -- 1 for true, 0 for false, NULL for writing pending
  awarded_marks REAL,
  evaluator_id TEXT,
  evaluator_feedback TEXT,
  ai_suggested_score REAL,
  ai_rationale TEXT,
  evaluated_at DATETIME,
  FOREIGN KEY (attempt_id) REFERENCES assessment_attempts(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id)
);

CREATE TABLE IF NOT EXISTS study_materials (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  material_type TEXT NOT NULL, -- 'PDF', 'DOCX', 'PPT', 'URL'
  file_url TEXT NOT NULL,
  page_count INTEGER,
  target_type TEXT NOT NULL DEFAULT 'ALL',
  target_department TEXT,
  target_community TEXT,
  published_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT
);

CREATE TABLE IF NOT EXISTS attendance_sessions (
  id TEXT PRIMARY KEY,
  community TEXT,
  department TEXT,
  date TEXT NOT NULL,
  code TEXT NOT NULL,
  start_time DATETIME NOT NULL,
  expires_at DATETIME NOT NULL,
  created_by TEXT
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  marked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'PRESENT',
  UNIQUE(session_id, student_id),
  FOREIGN KEY (session_id) REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_type TEXT NOT NULL DEFAULT 'ALL',
  target_department TEXT,
  target_community TEXT,
  priority TEXT NOT NULL DEFAULT 'NORMAL', -- 'NORMAL', 'IMPORTANT'
  scheduled_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notification_reads (
  notification_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (notification_id, student_id),
  FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id)
);

CREATE TABLE IF NOT EXISTS tab_switch_events (
  id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  assessment_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'VISIBILITY_HIDDEN', 'WINDOW_BLUR', 'TAB_LEAVE'
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (attempt_id) REFERENCES assessment_attempts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS student_progress (
  id TEXT PRIMARY KEY,
  student_id TEXT UNIQUE NOT NULL,
  materials_viewed_count INTEGER DEFAULT 0,
  assessments_completed_count INTEGER DEFAULT 0,
  avg_score REAL DEFAULT 0,
  attendance_pct REAL DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS doubt_conversations (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  material_id TEXT,
  topic TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (material_id) REFERENCES study_materials(id)
);

CREATE TABLE IF NOT EXISTS doubt_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  sender TEXT NOT NULL, -- 'student', 'ai'
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES doubt_conversations(id) ON DELETE CASCADE
);
