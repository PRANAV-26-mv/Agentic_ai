export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'STUDENT';
  is_super_admin?: boolean;
  student_id?: string;
  department?: string;
  year?: number;
  community?: string;
  skill_level?: string;
  profile?: string;
  interest?: string;
  suggested_role?: string;
}

export interface Student {
  id: string;
  student_id: string;
  name: string;
  email: string;
  department: string;
  year: number;
  community: string;
  skill_level: string;
  profile?: string;
  interest?: string;
  suggested_role?: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
}

export interface Admin {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'ADMIN';
  is_super_admin?: boolean;
  department: string;
  created_at: string;
}

export interface StudyMaterial {
  id: string;
  title: string;
  description?: string;
  material_type: 'PDF' | 'DOCX' | 'PPT' | 'URL';
  file_url: string;
  page_count?: number;
  target_type: 'ALL' | 'COMMUNITY' | 'DEPARTMENT' | 'SELECTED';
  target_department?: string;
  target_community?: string;
  published_date: string;
  created_by: string;
}

export interface Question {
  id: string;
  source_pdf_id?: string;
  question_type: 'MCQ' | 'WRITING';
  question_text: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  correct_answer?: string;
  explanation?: string;
  rubric?: string;
  expected_answer?: string;
  marks: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic?: string;
  status: 'DRAFT' | 'REVIEW' | 'APPROVED' | 'REJECTED';
  created_at: string;
}

export interface QuestionPool {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  question_ids?: string[];
}

export interface Assessment {
  id: string;
  title: string;
  description?: string;
  type: 'MCQ' | 'WRITING' | 'HYBRID';
  question_selection_mode: 'FIXED' | 'RANDOMIZED_POOL';
  pool_id?: string;
  draw_count?: number;
  community?: string;
  department?: string;
  target_type: 'ALL' | 'COMMUNITY' | 'DEPARTMENT' | 'SELECTED';
  duration_minutes: number;
  start_time: string;
  end_time: string;
  passing_percentage: number;
  max_marks: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  created_by?: string;
  created_at: string;
  questions?: Question[];
}

export interface AssessmentAttempt {
  id: string;
  assessment_id: string;
  student_id: string;
  started_at: string;
  expires_at: string;
  submitted_at?: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'AUTO_SUBMITTED' | 'EXPIRED';
  mcq_score: number;
  writing_score: number;
  total_score: number;
  percentage: number;
  tab_switches_count: number;
  assigned_questions_json?: string;
}

export interface StudentAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  student_answer?: string;
  selected_option?: string;
  is_correct?: boolean | null;
  awarded_marks?: number;
  evaluator_id?: string;
  evaluator_feedback?: string;
  ai_suggested_score?: number;
  ai_rationale?: string;
  evaluated_at?: string;
}

export interface AttendanceSession {
  id: string;
  community?: string;
  department?: string;
  date: string;
  code: string;
  start_time: string;
  expires_at: string;
  created_by?: string;
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  marked_at: string;
  status: 'PRESENT';
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  target_type: 'ALL' | 'COMMUNITY' | 'DEPARTMENT' | 'SELECTED';
  target_department?: string;
  target_community?: string;
  priority: 'NORMAL' | 'IMPORTANT';
  scheduled_at?: string;
  created_at: string;
  is_read?: boolean;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_role: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  metadata?: string;
  timestamp: string;
  actor_name?: string;
  actor_email?: string;
}

export interface DoubtMessage {
  id: string;
  conversation_id: string;
  sender: 'student' | 'ai';
  content: string;
  created_at: string;
}
