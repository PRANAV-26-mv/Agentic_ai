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

export interface RestrictedEmail {
  id: string;
  email: string;
  reason?: string;
  restricted_by: string;
  restricted_at: string;
}

export interface EmailLog {
  id: string;
  subject: string;
  message: string;
  recipients_count: number;
  recipients: string[];
  recipient_types: {
    students: number;
    admins: number;
    custom: number;
  };
  sent_by_id: string;
  sent_by_name: string;
  sent_by_email: string;
  status: 'SENT' | 'SIMULATED' | 'FAILED';
  error_details?: string;
  sent_at: string;
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
  question_ids?: string[];
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
  attendee_count?: number;
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  marked_at: string;
  status: 'PRESENT';
}

export interface AttendanceAttendee {
  record_id: string;
  session_id: string;
  session_code: string;
  session_date: string;
  session_community: string;
  session_department: string;
  student_id: string;
  student_name: string;
  student_reg: string;
  student_department: string;
  student_community: string;
  student_email: string;
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

export interface QuizSession {
  id: string;
  title: string;
  description?: string;
  pin: string;
  assessment_id?: string;
  question_ids: string[];
  target_type: 'ALL' | 'DEPARTMENT' | 'COMMUNITY';
  target_department?: string;
  target_community?: string;
  duration_minutes: number;
  start_time: string;
  end_time: string;
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  created_by: string;
  created_at: string;
  participant_count?: number;
  submitted_count?: number;
  all_students_finished?: boolean;
  my_status?: 'LOBBY' | 'IN_PROGRESS' | 'SUBMITTED' | 'TIMED_OUT' | null;
  my_score?: number | null;
  my_max_score?: number | null;
  my_percentage?: number | null;
  my_time_taken_seconds?: number | null;
  my_rank?: number | null;
  questions?: Question[];
  participants?: QuizSessionParticipant[];
  leaderboard?: QuizLeaderboardEntry[];
  my_participant?: QuizSessionParticipant;
}

export interface QuizSessionParticipant {
  id: string;
  session_id: string;
  student_id: string;
  student_name: string;
  student_reg: string;
  student_department: string;
  student_community: string;
  joined_at: string;
  started_at?: string;
  submitted_at?: string;
  status: 'LOBBY' | 'IN_PROGRESS' | 'SUBMITTED' | 'TIMED_OUT';
  score?: number;
  max_score?: number;
  percentage?: number;
  time_taken_seconds?: number;
  rank?: number;
  answers_json?: string;
  tab_switches_count?: number;
}

export interface QuizLeaderboardEntry {
  rank: number;
  student_id: string;
  student_name: string;
  student_reg: string;
  student_department: string;
  student_community: string;
  score: number;
  max_score: number;
  percentage: number;
  time_taken_seconds: number;
  submitted_at?: string;
  tab_switches_count?: number;
}

export type MeetingType = 'VIDEO_VOICE' | 'VOICE_ONLY';
export type MeetingAudienceType = 'ALL_STUDENTS' | 'SPECIFIC_STUDENTS' | 'ADMINS_ONLY' | 'ALL';
export type MeetingStatus = 'SCHEDULED' | 'ACTIVE' | 'ENDED';

export interface Meeting {
  id: string;
  code: string;
  title: string;
  description?: string;
  host_id: string;
  host_name: string;
  host_email: string;
  meeting_type: MeetingType;
  audience_type: MeetingAudienceType;
  target_department?: string;
  target_year?: number;
  status: MeetingStatus;
  scheduled_start_time: string;
  scheduled_end_time?: string;
  actual_start_time?: string;
  actual_end_time?: string;
  allow_screen_share: boolean;
  allow_student_chat: boolean;
  mute_on_entry: boolean;
  external_link?: string;
  invited_members?: InvitedMember[];
  created_at: string;
  updated_at: string;
  total_participants_count?: number;
  active_participants_count?: number;
  is_host?: boolean;
}

export interface InvitedMember {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'STUDENT';
  department?: string;
  invited_at?: string;
}

export interface MemberResponse {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'STUDENT';
  department: string;
  status: 'JOINED' | 'LEFT' | 'INVITED';
  invited_at: string;
  joined_at: string | null;
  left_at: string | null;
  duration_seconds: number | null;
}

export interface DirectoryMember {
  id: string;
  name: string;
  email: string;
  department: string;
  year?: number;
  student_id?: string;
  role: 'ADMIN' | 'STUDENT';
}

export interface MeetingParticipant {
  id: string;
  meeting_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_role: 'ADMIN' | 'STUDENT';
  joined_at: string;
  left_at?: string;
  duration_seconds?: number;
  is_host: boolean;
}

export interface MeetingSettings {
  id: string;
  is_enabled: boolean;
  allow_all_admins: boolean;
  permitted_admin_ids: string[];
  allowed_audience_types: MeetingAudienceType[];
  max_participants: number;
  updated_at: string;
  updated_by?: string;
}

export interface AdminMeetingPermission {
  id: string;
  name: string;
  email: string;
  department: string;
  is_super_admin: boolean;
  can_create_meetings: boolean;
}

