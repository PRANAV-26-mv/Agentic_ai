import { db, memoryDb } from '../config/database';
export { memoryDb, db };
import { v4 as uuidv4 } from 'uuid';

export interface Admin {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'ADMIN';
  is_super_admin?: boolean;
  department: string;
  created_at: string;
  email_app_password?: string;
}

export interface Student {
  id: string;
  student_id: string;
  name: string;
  email: string;
  password?: string;
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
  status: 'SENT' | 'SIMULATED' | 'FAILED' | 'SENT_VIA_GMAIL';
  error_details?: string;
  sent_at: string;
}

export interface CertificateSettings {
  id: string;
  header_brand_name: string;
  header_subtitle: string;
  document_title: string;
  presentation_line: string;
  rank_1_title: string;
  rank_2_title: string;
  rank_3_title: string;
  rank_participant_title: string;
  signatory_1_name: string;
  signatory_1_title: string;
  signatory_1_subtitle: string;
  signatory_2_name: string;
  signatory_2_title: string;
  signatory_2_subtitle: string;
  seal_text: string;
  seal_subtext: string;
  footer_verification_text: string;
  show_score: boolean;
  show_accuracy: boolean;
  show_time_taken: boolean;
  show_rank: boolean;
  show_signatures: boolean;
  show_seal: boolean;
  show_registration_id: boolean;
  show_department: boolean;
  custom_remarks?: string;
  updated_at: string;
  updated_by?: string;
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
}

export interface InvitedMember {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'STUDENT';
  department?: string;
  invited_at: string;
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

export const DEFAULT_MEETING_SETTINGS: MeetingSettings = {
  id: 'global-meeting-settings',
  is_enabled: true,
  allow_all_admins: true,
  permitted_admin_ids: [],
  allowed_audience_types: ['ALL_STUDENTS', 'SPECIFIC_STUDENTS', 'ADMINS_ONLY', 'ALL'],
  max_participants: 100,
  updated_at: new Date().toISOString()
};

export const DEFAULT_CERTIFICATE_SETTINGS: CertificateSettings = {
  id: 'global-cert-settings',
  header_brand_name: 'AGENTIC_AI_A7',
  header_subtitle: 'EXCELLENCE IN ARTIFICIAL INTELLIGENCE & EVALUATION',
  document_title: 'OFFICIAL CERTIFICATE OF ACHIEVEMENT',
  presentation_line: 'This prestigious credential is proudly presented to',
  rank_1_title: '1ST PLACE CHAMPION • GOLD HONORS 🥇',
  rank_2_title: '2ND PLACE RUNNER-UP • SILVER DISTINCTION 🥈',
  rank_3_title: '3RD PLACE PODIUM STANDOUT • BRONZE DISTINCTION 🥉',
  rank_participant_title: 'RANK #{rank} OF {total} PEERS • MERIT EXCELLENCE',
  signatory_1_name: 'Dr. Julian Vance, Ph.D.',
  signatory_1_title: 'Director of AI Evaluation',
  signatory_1_subtitle: 'Academic Certification Board',
  signatory_2_name: 'AGENTIC_AI_A7 Neural Engine',
  signatory_2_title: 'AGENTIC_AI_A7 Proctoring System',
  signatory_2_subtitle: 'Autonomous Evaluation System',
  seal_text: 'AGENTIC_AI_A7',
  seal_subtext: 'AUTHENTICATED',
  footer_verification_text: 'Validated by AGENTIC_AI_A7 Examination Framework',
  show_score: true,
  show_accuracy: true,
  show_time_taken: true,
  show_rank: true,
  show_signatures: true,
  show_seal: true,
  show_registration_id: true,
  show_department: true,
  custom_remarks: 'Awarded for demonstrating verified technical mastery and proctored assessment excellence.',
  updated_at: new Date().toISOString(),
  updated_by: 'SYSTEM'
};

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
  max_score?: number;
  writing_pending?: boolean;
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

export interface Notification {
  id: string;
  title: string;
  message: string;
  target_type: 'ALL' | 'COMMUNITY' | 'DEPARTMENT' | 'SELECTED' | 'ADMINS_ONLY' | 'STUDENTS_ONLY';
  target_department?: string;
  target_community?: string;
  priority: 'NORMAL' | 'IMPORTANT';
  scheduled_at?: string;
  created_at: string;
  sender_role?: 'SUPER_ADMIN' | 'ADMIN';
  sender_name?: string;
  action_url?: string;
  meeting_code?: string;
}

export interface NotificationRead {
  notification_id: string;
  student_id: string;
  read_at: string;
}

export interface TabSwitchEvent {
  id: string;
  attempt_id: string;
  student_id: string;
  assessment_id: string;
  event_type: string;
  timestamp: string;
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
}

export interface DoubtConversation {
  id: string;
  student_id: string;
  material_id?: string;
  topic?: string;
  created_at: string;
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
  draw_count?: number;
  target_type: 'ALL' | 'DEPARTMENT' | 'COMMUNITY';
  target_department?: string;
  target_community?: string;
  duration_minutes: number;
  start_time: string;
  end_time: string;
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  created_by: string;
  created_at: string;
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
  assigned_questions_json?: string;
}

// Data Model Helpers

export const AdminsModel = {
  findAll(): Admin[] {
    const list = memoryDb.table('admins') as Admin[];
    return list.map(a => ({
      ...a,
      is_super_admin: a.email.toLowerCase() === 'pranavannur9659@gmail.com' || Boolean(a.is_super_admin)
    }));
  },
  findByEmail(email: string): Admin | undefined {
    const admin = memoryDb.table('admins').find(a => a.email.toLowerCase() === email.toLowerCase()) as Admin | undefined;
    if (admin) {
      return {
        ...admin,
        is_super_admin: admin.email.toLowerCase() === 'pranavannur9659@gmail.com' || Boolean(admin.is_super_admin)
      };
    }
    return undefined;
  },
  findById(id: string): Admin | undefined {
    const admin = memoryDb.table('admins').find(a => a.id === id) as Admin | undefined;
    if (admin) {
      return {
        ...admin,
        is_super_admin: admin.email.toLowerCase() === 'pranavannur9659@gmail.com' || Boolean(admin.is_super_admin)
      };
    }
    return undefined;
  },
  create(admin: Omit<Admin, 'id' | 'created_at'>): Admin {
    const newAdmin: Admin = {
      ...admin,
      id: `adm-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    memoryDb.table('admins').push(newAdmin);
    db.save();
    return newAdmin;
  },
  update(id: string, updates: Partial<Admin>): Admin | undefined {
    const list = memoryDb.table('admins') as Admin[];
    const index = list.findIndex(a => a.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...updates };
      db.save();
      return {
        ...list[index],
        is_super_admin: list[index].email.toLowerCase() === 'pranavannur9659@gmail.com' || Boolean(list[index].is_super_admin)
      };
    }
    return undefined;
  },
  delete(id: string): boolean {
    const list = memoryDb.table('admins');
    const index = list.findIndex(a => a.id === id);
    if (index !== -1) {
      const target = list[index];
      if (target.email.toLowerCase() === 'pranavannur9659@gmail.com') {
        throw new Error('Cannot delete Super Admin / Portal Owner account.');
      }
      list.splice(index, 1);
      db.save();
      return true;
    }
    return false;
  }
};

export const StudentsModel = {
  findAll(filters?: { department?: string; year?: number; community?: string; search?: string; status?: string }): Student[] {
    let list = memoryDb.table('students');
    if (filters) {
      if (filters.status) list = list.filter(s => s.status === filters.status);
      if (filters.department) list = list.filter(s => s.department === filters.department);
      if (filters.year) list = list.filter(s => s.year === Number(filters.year));
      if (filters.community) list = list.filter(s => s.community === filters.community);
      if (filters.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(s =>
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.student_id.toLowerCase().includes(q)
        );
      }
    }
    return list;
  },
  findByEmail(email: string): Student | undefined {
    return memoryDb.table('students').find(s => s.email.toLowerCase() === email.toLowerCase());
  },
  findByStudentId(studentId: string): Student | undefined {
    return memoryDb.table('students').find(s => s.student_id.toLowerCase() === studentId.toLowerCase());
  },
  findById(id: string): Student | undefined {
    return memoryDb.table('students').find(s => s.id === id);
  },
  create(student: Omit<Student, 'id' | 'created_at' | 'status'>): Student {
    const newStudent: Student = {
      ...student,
      id: `std-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: 'ACTIVE',
      created_at: new Date().toISOString()
    };
    memoryDb.table('students').push(newStudent);
    
    // Create student progress entry
    memoryDb.table('student_progress').push({
      id: uuidv4(),
      student_id: newStudent.id,
      materials_viewed_count: 0,
      assessments_completed_count: 0,
      avg_score: 0,
      attendance_pct: 100,
      updated_at: new Date().toISOString()
    });

    db.save();
    return newStudent;
  },
  update(id: string, updates: Partial<Student>): Student | undefined {
    const list = memoryDb.table('students');
    const index = list.findIndex(s => s.id === id);
    if (index === -1) return undefined;
    
    // Prevent updating locked fields by students if specified
    const updated = { ...list[index], ...updates };
    list[index] = updated;
    db.save();
    return updated;
  },
  delete(id: string): boolean {
    const list = memoryDb.table('students');
    const index = list.findIndex(s => s.id === id);
    if (index !== -1) {
      list.splice(index, 1);
      // Also remove associated progress record
      const progressList = memoryDb.table('student_progress');
      const pIdx = progressList.findIndex(p => p.student_id === id);
      if (pIdx !== -1) progressList.splice(pIdx, 1);
      db.save();
      return true;
    }
    return false;
  },
  deactivate(id: string): boolean {
    const student = this.findById(id);
    if (student) {
      student.status = 'INACTIVE';
      db.save();
      return true;
    }
    return false;
  }
};

export const StudyMaterialsModel = {
  findAll(student?: Student): StudyMaterial[] {
    let list = memoryDb.table('study_materials');
    if (student) {
      const sDept = (student.department || '').trim().toLowerCase();
      const sComm = (student.community || '').trim().toLowerCase();
      list = list.filter(m => {
        if (!m.target_type || m.target_type === 'ALL') return true;
        if (m.target_type === 'DEPARTMENT' && sDept) {
          const mDept = (m.target_department || '').trim().toLowerCase();
          return mDept === sDept || mDept === 'all' || sDept.includes(mDept) || mDept.includes(sDept);
        }
        if (m.target_type === 'COMMUNITY' && sComm) {
          const mComm = (m.target_community || '').trim().toLowerCase();
          return mComm === sComm || mComm === 'all' || sComm.includes(mComm) || mComm.includes(sComm);
        }
        return false;
      });
    }
    return list;
  },
  findById(id: string): StudyMaterial | undefined {
    return memoryDb.table('study_materials').find(m => m.id === id);
  },
  create(mat: Omit<StudyMaterial, 'id' | 'published_date'>): StudyMaterial {
    const newMat: StudyMaterial = {
      ...mat,
      id: `mat-${Date.now()}`,
      published_date: new Date().toISOString()
    };
    memoryDb.table('study_materials').push(newMat);
    db.save();
    return newMat;
  },
  update(id: string, updates: Partial<StudyMaterial>): StudyMaterial | null {
    const list = memoryDb.table('study_materials');
    const index = list.findIndex(m => m.id === id);
    if (index === -1) return null;
    const existing = list[index];
    const updated: StudyMaterial = {
      ...existing,
      ...updates,
      id: existing.id,
      published_date: updates.published_date || existing.published_date || new Date().toISOString()
    };
    list[index] = updated;
    db.save();
    return updated;
  },
  delete(id: string): boolean {
    const list = memoryDb.table('study_materials');
    const index = list.findIndex(m => m.id === id);
    if (index !== -1) {
      list.splice(index, 1);
      db.save();
      return true;
    }
    return false;
  }
};

export function isQuestionAnswerCorrect(q: Question, selected?: string): boolean {
  if (!selected || !q.correct_answer) return false;

  const normalizeToLetter = (val?: string): 'A' | 'B' | 'C' | 'D' | null => {
    if (!val) return null;
    const trimmed = val.trim().toUpperCase();

    // Direct single letter
    if (['A', 'B', 'C', 'D'].includes(trimmed)) {
      return trimmed as 'A' | 'B' | 'C' | 'D';
    }

    // Match OPTION_A, OPTION A, OPTION-A, OPTIONA
    const optMatch = trimmed.match(/^OPTION[_\s-]?([A-D])$/);
    if (optMatch) {
      return optMatch[1] as 'A' | 'B' | 'C' | 'D';
    }

    // Match (A), A., A), A:
    const prefixMatch = trimmed.match(/^\(?([A-D])[\.\)\:\s]/);
    if (prefixMatch) {
      return prefixMatch[1] as 'A' | 'B' | 'C' | 'D';
    }

    // Match full option text against q.option_a, b, c, d
    const clean = (s?: string) => s ? s.trim().toLowerCase().replace(/\s+/g, ' ') : '';
    const cleanVal = clean(val);
    if (cleanVal) {
      if (q.option_a && clean(q.option_a) === cleanVal) return 'A';
      if (q.option_b && clean(q.option_b) === cleanVal) return 'B';
      if (q.option_c && clean(q.option_c) === cleanVal) return 'C';
      if (q.option_d && clean(q.option_d) === cleanVal) return 'D';
    }

    return null;
  };

  const corrLetter = normalizeToLetter(q.correct_answer);
  const selLetter = normalizeToLetter(selected);

  if (corrLetter && selLetter) {
    return corrLetter === selLetter;
  }

  // Exact cleaned text match fallback
  const clean = (s?: string) => s ? s.trim().toLowerCase().replace(/\s+/g, ' ') : '';
  return clean(selected) === clean(q.correct_answer);
}

export const QuestionsModel = {
  findAll(filters?: { type?: string; difficulty?: string; topic?: string; status?: string }): Question[] {
    let list = memoryDb.table('questions');
    if (filters) {
      if (filters.status) list = list.filter(q => q.status === filters.status);
      if (filters.type) list = list.filter(q => q.question_type === filters.type);
      if (filters.difficulty) list = list.filter(q => q.difficulty === filters.difficulty);
      if (filters.topic) list = list.filter(q => q.topic === filters.topic);
    }
    return list;
  },
  findById(id: string): Question | undefined {
    return memoryDb.table('questions').find(q => q.id === id);
  },
  create(q: Omit<Question, 'id' | 'created_at'>): Question {
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const counter = Math.floor(Math.random() * 10000);
    const newQ: Question = {
      ...q,
      id: `q-${Date.now()}-${randomSuffix}-${counter}`,
      created_at: new Date().toISOString()
    };
    memoryDb.table('questions').push(newQ);
    db.save();
    return newQ;
  },
  update(id: string, updates: Partial<Question>): Question | undefined {
    const list = memoryDb.table('questions');
    const index = list.findIndex(q => q.id === id);
    if (index === -1) return undefined;
    const updated = { ...list[index], ...updates };
    list[index] = updated;
    db.save();
    return updated;
  },
  approve(id: string): Question | undefined {
    return this.update(id, { status: 'APPROVED' });
  },
  reject(id: string): Question | undefined {
    return this.update(id, { status: 'REJECTED' });
  },
  batchApprove(ids: string[]): Question[] {
    const idSet = new Set(ids);
    const list = memoryDb.table('questions');
    const updated: Question[] = [];
    list.forEach(q => {
      if (idSet.has(q.id)) {
        q.status = 'APPROVED';
        updated.push(q);
      }
    });
    if (updated.length > 0) db.save();
    return updated;
  },
  batchReject(ids: string[]): Question[] {
    const idSet = new Set(ids);
    const list = memoryDb.table('questions');
    const updated: Question[] = [];
    list.forEach(q => {
      if (idSet.has(q.id)) {
        q.status = 'REJECTED';
        updated.push(q);
      }
    });
    if (updated.length > 0) db.save();
    return updated;
  },
  delete(id: string): boolean {
    const list = memoryDb.table('questions');
    const index = list.findIndex(q => q.id === id);
    if (index !== -1) {
      list.splice(index, 1);
      db.save();
      return true;
    }
    return false;
  },
  deleteAll(): void {
    const data = memoryDb.getData();
    data.questions = [];
    db.save();
  }
};

export const QuestionPoolsModel = {
  findAll(): QuestionPool[] {
    return memoryDb.table('question_pools');
  },
  findById(id: string): QuestionPool | undefined {
    return memoryDb.table('question_pools').find(p => p.id === id);
  },
  create(pool: Omit<QuestionPool, 'id' | 'created_at'>): QuestionPool {
    const newPool: QuestionPool = {
      ...pool,
      id: `pool-${Date.now()}`,
      created_at: new Date().toISOString(),
      question_ids: pool.question_ids || []
    };
    memoryDb.table('question_pools').push(newPool);
    db.save();
    return newPool;
  },
  addQuestion(poolId: string, questionId: string) {
    const pool = this.findById(poolId);
    if (pool) {
      if (!pool.question_ids) pool.question_ids = [];
      if (!pool.question_ids.includes(questionId)) {
        pool.question_ids.push(questionId);
        db.save();
      }
    }
  },
  delete(id: string): boolean {
    const list = memoryDb.table('question_pools');
    const index = list.findIndex(p => p.id === id);
    if (index !== -1) {
      list.splice(index, 1);
      db.save();
      return true;
    }
    return false;
  }
};

export const AssessmentsModel = {
  findAll(): Assessment[] {
    return memoryDb.table('assessments');
  },
  findAssignedForStudent(student: Student): Assessment[] {
    const all = memoryDb.table('assessments').filter(a => a.status === 'PUBLISHED');
    return all.filter(a => {
      if (a.target_type === 'ALL') return true;
      if (a.target_type === 'DEPARTMENT' && a.department === student.department) return true;
      if (a.target_type === 'COMMUNITY' && a.community === student.community) return true;
      return false;
    });
  },
  findById(id: string): Assessment | undefined {
    return memoryDb.table('assessments').find(a => a.id === id);
  },
  create(ass: Omit<Assessment, 'id' | 'created_at'>): Assessment {
    const newAss: Assessment = {
      ...ass,
      id: `ass-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    memoryDb.table('assessments').push(newAss);
    db.save();
    return newAss;
  },
  update(id: string, updates: Partial<Assessment>): Assessment | undefined {
    const list = memoryDb.table('assessments');
    const index = list.findIndex(a => a.id === id);
    if (index === -1) return undefined;
    const updated = { ...list[index], ...updates };
    list[index] = updated;
    db.save();
    return updated;
  },
  duplicate(id: string): Assessment | undefined {
    const original = this.findById(id);
    if (!original) return undefined;
    const duplicated: Assessment = {
      ...original,
      id: `ass-${Date.now()}`,
      title: `${original.title} (Copy)`,
      status: 'DRAFT',
      created_at: new Date().toISOString()
    };
    memoryDb.table('assessments').push(duplicated);
    db.save();
    return duplicated;
  },
  delete(id: string): boolean {
    const list = memoryDb.table('assessments');
    const index = list.findIndex(a => a.id === id);
    if (index !== -1) {
      list.splice(index, 1);
      db.save();
      return true;
    }
    return false;
  }
};

export function ensureDefaultQuestions(): Question[] {
  let existing = QuestionsModel.findAll({ status: 'APPROVED' });
  if (existing.length > 0) return existing;

  const sampleQuestions: Array<Omit<Question, 'id' | 'created_at'>> = [
    {
      question_type: 'MCQ',
      question_text: 'What is the core distinction of a ReAct (Reasoning + Acting) agent compared to a standard prompt pipeline?',
      option_a: 'It executes code natively without external tools',
      option_b: 'It interleaves reasoning step thoughts with tool execution observations in an iterative loop',
      option_c: 'It pre-compiles all decision paths before execution',
      option_d: 'It relies solely on zero-shot memory search',
      correct_answer: 'B',
      explanation: 'ReAct agents iteratively generate reasoning traces (Thought) and actions (Tool invocation), observing tool outputs before deciding the next step.',
      marks: 2,
      difficulty: 'Medium',
      topic: 'Agentic Workflows',
      status: 'APPROVED'
    },
    {
      question_type: 'MCQ',
      question_text: 'Which component in a RAG (Retrieval-Augmented Generation) system converts unstructured text into dense semantic vector representations?',
      option_a: 'Tokenizer',
      option_b: 'Embedding Model',
      option_c: 'Cross-Encoder Reranker',
      option_d: 'Decoder Head',
      correct_answer: 'B',
      explanation: 'Embedding models map text chunks into high-dimensional vector spaces where semantic similarity can be computed via cosine distance.',
      marks: 2,
      difficulty: 'Easy',
      topic: 'RAG Systems',
      status: 'APPROVED'
    },
    {
      question_type: 'MCQ',
      question_text: 'What is the primary advantage of FlashAttention over standard Multi-Head Attention in modern LLM architectures?',
      option_a: 'It eliminates the need for Positional Embeddings',
      option_b: 'It reduces memory IO complexity from quadratic O(N²) to linear by tiling GPU SRAM operations',
      option_c: 'It converts self-attention into feed-forward layers',
      option_d: 'It increases vocabulary size automatically',
      correct_answer: 'B',
      explanation: 'FlashAttention optimizes GPU memory bandwidth by executing attention matrix computation in SRAM tiles without writing full N x N matrices to HBM.',
      marks: 2,
      difficulty: 'Hard',
      topic: 'LLM Architectures',
      status: 'APPROVED'
    },
    {
      question_type: 'WRITING',
      question_text: 'Explain the trade-offs between a single centralized orchestrator agent vs. a decentralized multi-agent network for complex software tasks.',
      rubric: 'Centralized: 2 marks for clear single-point control vs complexity. Decentralized: 2 marks for modularity & scalability vs communication overhead. Examples & Clarity: 1 mark.',
      expected_answer: 'A centralized orchestrator maintains global state and plan clarity, but can become a bottleneck or failure point. Decentralized networks distribute specialized tasks to autonomous worker agents, improving modularity but requiring robust inter-agent protocols.',
      marks: 5,
      difficulty: 'Medium',
      topic: 'Multi-Agent Systems',
      status: 'APPROVED'
    },
    {
      question_type: 'WRITING',
      question_text: 'Describe how Chain-of-Thought (CoT) prompting alters model inference and why it improves performance on multi-step reasoning problems.',
      rubric: 'Model compute allocation explanation: 2 marks. Multi-step decomposition: 2 marks. Practical example: 1 mark.',
      expected_answer: 'Chain-of-Thought forces the model to generate intermediate reasoning tokens, effectively extending sequence-level compute budget before outputting the final answer.',
      marks: 5,
      difficulty: 'Easy',
      topic: 'Prompt Engineering',
      status: 'APPROVED'
    }
  ];

  return sampleQuestions.map(q => QuestionsModel.create(q));
}

export const AssessmentAttemptsModel = {
  findAttempt(studentId: string, assessmentId: string): AssessmentAttempt | undefined {
    return memoryDb.table('assessment_attempts').find(
      att => att.student_id === studentId && att.assessment_id === assessmentId
    );
  },
  findAll(): AssessmentAttempt[] {
    return memoryDb.table('assessment_attempts');
  },
  createAttempt(studentId: string, assessment: Assessment): { attempt: AssessmentAttempt; questions: Question[] } {
    let assignedQuestions: Question[] = [];

    if (assessment.question_selection_mode === 'RANDOMIZED_POOL' && assessment.pool_id) {
      const pool = QuestionPoolsModel.findById(assessment.pool_id);
      if (pool && pool.question_ids) {
        const poolQuestions = pool.question_ids
          .map(qid => QuestionsModel.findById(qid))
          .filter((q): q is Question => q !== undefined && q.status === 'APPROVED');
        
        // Shuffle pool questions deterministically for this attempt draw
        const drawCount = assessment.draw_count || Math.min(poolQuestions.length, 40);
        const shuffled = [...poolQuestions].sort(() => 0.5 - Math.random());
        assignedQuestions = shuffled.slice(0, drawCount);
      }
    } else if (
      (assessment.question_selection_mode === 'RANDOMIZED_POOL' || (assessment.draw_count && assessment.draw_count > 0)) &&
      assessment.question_ids && assessment.question_ids.length > 0
    ) {
      // Randomized draw from assessment's assigned questions (e.g. 100 questions from PDF, draw 40)
      const allAssigned = assessment.question_ids
        .map(qid => QuestionsModel.findById(qid))
        .filter((q): q is Question => q !== undefined);
      
      const drawCount = (assessment.draw_count && assessment.draw_count > 0 && assessment.draw_count < allAssigned.length)
        ? assessment.draw_count
        : allAssigned.length;
      
      const shuffled = [...allAssigned].sort(() => 0.5 - Math.random());
      assignedQuestions = shuffled.slice(0, drawCount);
    } else {
      // Fixed set of questions
      const fixedIds = assessment.question_ids || [];
      if (fixedIds.length > 0) {
        assignedQuestions = fixedIds
          .map(qid => QuestionsModel.findById(qid))
          .filter((q): q is Question => q !== undefined);
      } else {
        // Fallback to all approved questions linked via assessment_questions table or general approved list
        const linked = memoryDb.table('assessment_questions')
          .filter(aq => aq.assessment_id === assessment.id)
          .map(aq => QuestionsModel.findById(aq.question_id))
          .filter((q): q is Question => q !== undefined);
        assignedQuestions = linked.length > 0 ? linked : QuestionsModel.findAll({ status: 'APPROVED' }).slice(0, 5);
      }
    }

    if (assignedQuestions.length === 0) {
      assignedQuestions = ensureDefaultQuestions();
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + assessment.duration_minutes * 60 * 1000);

    const attempt: AssessmentAttempt = {
      id: `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      assessment_id: assessment.id,
      student_id: studentId,
      started_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      status: 'IN_PROGRESS',
      mcq_score: 0,
      writing_score: 0,
      total_score: 0,
      percentage: 0,
      tab_switches_count: 0,
      assigned_questions_json: JSON.stringify(assignedQuestions.map(q => q.id))
    };

    memoryDb.table('assessment_attempts').push(attempt);
    db.save();

    return { attempt, questions: assignedQuestions };
  },
  getAttemptQuestions(attempt: AssessmentAttempt): Question[] {
    let questions: Question[] = [];
    if (attempt.assigned_questions_json) {
      try {
        const qids: string[] = JSON.parse(attempt.assigned_questions_json);
        questions = qids.map(id => QuestionsModel.findById(id)).filter((q): q is Question => q !== undefined);
      } catch {
        questions = [];
      }
    }
    if (questions.length === 0) {
      questions = ensureDefaultQuestions();
      attempt.assigned_questions_json = JSON.stringify(questions.map(q => q.id));
      db.save();
    }
    return questions;
  },
  saveAnswer(attemptId: string, questionId: string, data: { selected_option?: string; student_answer?: string }) {
    const list = memoryDb.table('student_answers');
    let ans = list.find(a => a.attempt_id === attemptId && a.question_id === questionId);
    
    if (!ans) {
      ans = {
        id: `ans-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        attempt_id: attemptId,
        question_id: questionId
      };
      list.push(ans);
    }

    if (data.selected_option !== undefined) ans.selected_option = data.selected_option;
    if (data.student_answer !== undefined) ans.student_answer = data.student_answer;

    db.save();
    return ans;
  },
  getStudentAnswers(attemptId: string): StudentAnswer[] {
    return memoryDb.table('student_answers').filter(a => a.attempt_id === attemptId);
  },
  submitAttempt(attemptId: string, autoSubmitted = false): AssessmentAttempt {
    const attempt = memoryDb.table('assessment_attempts').find(a => a.id === attemptId);
    if (!attempt) throw new Error('Attempt not found');

    const questions = this.getAttemptQuestions(attempt);
    const answers = this.getStudentAnswers(attemptId);

    let mcqScore = 0;
    let writingPending = false;
    let writingScore = 0;

    for (const q of questions) {
      const ans = answers.find(a => a.question_id === q.id);
      if (q.question_type === 'MCQ') {
        const qMarks = typeof q.marks === 'number' && !isNaN(q.marks) && q.marks > 0 ? q.marks : 1;
        if (ans && isQuestionAnswerCorrect(q, ans.selected_option)) {
          ans.is_correct = true;
          ans.awarded_marks = qMarks;
          mcqScore += qMarks;
        } else if (ans) {
          ans.is_correct = false;
          ans.awarded_marks = 0;
        }
      } else if (q.question_type === 'WRITING') {
        if (ans && ans.awarded_marks !== undefined && ans.awarded_marks !== null) {
          writingScore += ans.awarded_marks;
        } else {
          writingPending = true;
        }
      }
    }

    const totalQuestionMarks = questions.reduce((acc, q) => {
      const m = typeof q.marks === 'number' && !isNaN(q.marks) && q.marks > 0 ? q.marks : 1;
      return acc + m;
    }, 0);
    const assessment = AssessmentsModel.findById(attempt.assessment_id);
    const maxMarks = totalQuestionMarks > 0 ? totalQuestionMarks : (assessment?.max_marks || 20);

    attempt.mcq_score = mcqScore;
    attempt.writing_score = writingScore;
    attempt.total_score = mcqScore + writingScore;
    attempt.max_score = maxMarks;
    attempt.writing_pending = writingPending;
    attempt.percentage = maxMarks > 0 ? Math.min(100, Math.round(((attempt.total_score) / maxMarks) * 100)) : 0;
    attempt.submitted_at = new Date().toISOString();
    attempt.status = autoSubmitted ? 'AUTO_SUBMITTED' : 'COMPLETED';

    // Update student progress statistics
    const prog = memoryDb.table('student_progress').find(p => p.student_id === attempt.student_id);
    if (prog) {
      prog.assessments_completed_count += 1;
      prog.updated_at = new Date().toISOString();
    }

    db.save();
    return attempt;
  },
  recordTabSwitch(attemptId: string, studentId: string, assessmentId: string, eventType: string): number {
    const attempt = memoryDb.table('assessment_attempts').find(a => a.id === attemptId);
    if (attempt) {
      attempt.tab_switches_count = (attempt.tab_switches_count || 0) + 1;
    }

    memoryDb.table('tab_switch_events').push({
      id: `ts-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      attempt_id: attemptId,
      student_id: studentId,
      assessment_id: assessmentId,
      event_type: eventType,
      timestamp: new Date().toISOString()
    });

    db.save();
    return attempt?.tab_switches_count || 0;
  }
};

export const AttendanceModel = {
  createSession(data: Omit<AttendanceSession, 'id' | 'start_time'>): AttendanceSession {
    const now = new Date();
    const session: AttendanceSession = {
      ...data,
      id: `sess-${Date.now()}`,
      start_time: now.toISOString(),
      expires_at: data.expires_at || new Date(now.getTime() + 60 * 60 * 1000).toISOString()
    };
    memoryDb.table('attendance_sessions').push(session);
    db.save();
    return session;
  },
  findAllSessions(): AttendanceSession[] {
    return memoryDb.table('attendance_sessions');
  },
  markAttendance(sessionId: string, studentId: string): { success: boolean; message: string; record?: AttendanceRecord } {
    const session = memoryDb.table('attendance_sessions').find(s => s.id === sessionId || s.code === sessionId);
    if (!session) return { success: false, message: 'Invalid attendance code' };

    const now = new Date();
    if (new Date(session.expires_at) < now) {
      return { success: false, message: 'This attendance code has expired.' };
    }

    const existing = memoryDb.table('attendance_records').find(
      r => r.session_id === session.id && r.student_id === studentId
    );
    if (existing) {
      return { success: false, message: 'You have already marked attendance for this session.' };
    }

    const record: AttendanceRecord = {
      id: `attrec-${Date.now()}`,
      session_id: session.id,
      student_id: studentId,
      marked_at: now.toISOString(),
      status: 'PRESENT'
    };

    memoryDb.table('attendance_records').push(record);
    db.save();
    return { success: true, message: 'Attendance marked successfully', record };
  },
  getStudentAttendance(studentId: string): { total: number; present: number; percentage: number; records: AttendanceRecord[] } {
    const records = memoryDb.table('attendance_records').filter(r => r.student_id === studentId);
    const sessions = memoryDb.table('attendance_sessions');
    const total = sessions.length || 1;
    const present = records.length;
    const percentage = Math.round((present / total) * 100);
    return { total, present, percentage, records };
  },
  getSessionAttendees(sessionId: string) {
    const session = (memoryDb.table('attendance_sessions') as AttendanceSession[]).find(
      s => s.id === sessionId || s.code === sessionId
    );
    if (!session) return [];

    const records = (memoryDb.table('attendance_records') as AttendanceRecord[]).filter(
      r => r.session_id === session.id
    );

    return records.map(r => {
      const student = StudentsModel.findById(r.student_id);
      return {
        record_id: r.id,
        session_id: session.id,
        session_code: session.code,
        session_date: session.date,
        session_community: session.community || 'ALL',
        session_department: session.department || 'ALL',
        student_id: r.student_id,
        student_name: student?.name || 'Unknown Student',
        student_reg: student?.student_id || r.student_id,
        student_department: student?.department || 'N/A',
        student_community: student?.community || 'N/A',
        student_email: student?.email || 'N/A',
        marked_at: r.marked_at,
        status: r.status || 'PRESENT'
      };
    }).sort((a, b) => new Date(b.marked_at).getTime() - new Date(a.marked_at).getTime());
  },
  getAllAttendees() {
    const sessions = memoryDb.table('attendance_sessions') as AttendanceSession[];
    const records = memoryDb.table('attendance_records') as AttendanceRecord[];

    return records.map(r => {
      const session = sessions.find(s => s.id === r.session_id);
      const student = StudentsModel.findById(r.student_id);
      return {
        record_id: r.id,
        session_id: r.session_id,
        session_code: session?.code || 'N/A',
        session_date: session?.date || 'N/A',
        session_community: session?.community || 'ALL',
        session_department: session?.department || 'ALL',
        student_id: r.student_id,
        student_name: student?.name || 'Unknown Student',
        student_reg: student?.student_id || r.student_id,
        student_department: student?.department || 'N/A',
        student_community: student?.community || 'N/A',
        student_email: student?.email || 'N/A',
        marked_at: r.marked_at,
        status: r.status || 'PRESENT'
      };
    }).sort((a, b) => new Date(b.marked_at).getTime() - new Date(a.marked_at).getTime());
  }
};

export const NotificationsModel = {
  findAll(): Notification[] {
    return memoryDb.table('notifications').slice().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },
  findById(id: string): Notification | undefined {
    return memoryDb.table('notifications').find(n => n.id === id);
  },
  create(data: Omit<Notification, 'id' | 'created_at'>): Notification {
    const notif: Notification = {
      ...data,
      id: `notif-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    memoryDb.table('notifications').push(notif);
    db.save();
    return notif;
  },
  update(id: string, updates: Partial<Notification>): Notification | undefined {
    const notifs = memoryDb.table('notifications');
    const index = notifs.findIndex(n => n.id === id);
    if (index !== -1) {
      notifs[index] = { ...notifs[index], ...updates };
      db.save();
      return notifs[index];
    }
    return undefined;
  },
  delete(id: string): boolean {
    const notifs = memoryDb.table('notifications');
    const index = notifs.findIndex(n => n.id === id);
    if (index !== -1) {
      notifs.splice(index, 1);
      const reads = memoryDb.table('notification_reads');
      const filteredReads = reads.filter(r => r.notification_id !== id);
      memoryDb.getData().notification_reads = filteredReads;
      db.save();
      return true;
    }
    return false;
  },
  getForStudent(student: Student): (Notification & { is_read: boolean })[] {
    const all = memoryDb.table('notifications');
    const reads = memoryDb.table('notification_reads').filter(r => r.student_id === student.id);
    const readSet = new Set(reads.map(r => r.notification_id));

    const targeted = all.filter(n => {
      // Students should NEVER receive notifications intended for admins only
      if (n.target_type === 'ADMINS_ONLY') return false;
      if (n.target_type === 'ALL' || n.target_type === 'STUDENTS_ONLY') return true;
      if (n.target_type === 'DEPARTMENT' && n.target_department === student.department) return true;
      if (n.target_type === 'COMMUNITY' && n.target_community === student.community) return true;
      return false;
    });

    return targeted.map(n => ({
      ...n,
      is_read: readSet.has(n.id)
    })).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },
  getForAdmin(admin?: Admin): (Notification & { is_read: boolean })[] {
    const all = memoryDb.table('notifications');
    const adminId = admin?.id || '';
    const reads = memoryDb.table('notification_reads').filter(r => r.student_id === adminId);
    const readSet = new Set(reads.map(r => r.notification_id));

    const isSuper = admin?.email?.toLowerCase() === 'pranavannur9659@gmail.com' || Boolean(admin?.is_super_admin);

    const targeted = all.filter(n => {
      // Super admin sees all notifications
      if (isSuper) return true;
      // Other admins see ALL, ADMINS_ONLY, or their department
      if (n.target_type === 'ALL' || n.target_type === 'ADMINS_ONLY') return true;
      if (admin?.department && n.target_department === admin.department) return true;
      // Also show student notifications so admins can monitor them
      return true;
    });

    return targeted.map(n => ({
      ...n,
      is_read: readSet.has(n.id)
    })).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },
  markRead(notificationId: string, userId: string) {
    const reads = memoryDb.table('notification_reads');
    if (!reads.some(r => r.notification_id === notificationId && r.student_id === userId)) {
      reads.push({
        notification_id: notificationId,
        student_id: userId,
        read_at: new Date().toISOString()
      });
      db.save();
    }
  }
};

export const AuditLogsModel = {
  log(actorId: string, actorRole: string, action: string, entityType: string, entityId?: string, metadata?: any) {
    const entry: AuditLog = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      actor_id: actorId,
      actor_role: actorRole,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata: metadata ? JSON.stringify(metadata) : undefined,
      timestamp: new Date().toISOString()
    };
    memoryDb.table('audit_logs').unshift(entry);
    db.save();
    return entry;
  },
  findAll(): AuditLog[] {
    return memoryDb.table('audit_logs');
  }
};

export const DoubtsModel = {
  findOrCreateConversation(studentId: string, materialId?: string, topic?: string): DoubtConversation {
    const list = memoryDb.table('doubt_conversations');
    let conv = list.find(c => c.student_id === studentId && (materialId ? c.material_id === materialId : true));
    if (!conv) {
      conv = {
        id: `conv-${Date.now()}`,
        student_id: studentId,
        material_id: materialId,
        topic: topic || 'General Study Material Query',
        created_at: new Date().toISOString()
      };
      list.push(conv);
      db.save();
    }
    return conv;
  },
  getMessages(conversationId: string): DoubtMessage[] {
    return memoryDb.table('doubt_messages').filter(m => m.conversation_id === conversationId);
  },
  addMessage(conversationId: string, sender: 'student' | 'ai', content: string): DoubtMessage {
    const msg: DoubtMessage = {
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      conversation_id: conversationId,
      sender,
      content,
      created_at: new Date().toISOString()
    };
    memoryDb.table('doubt_messages').push(msg);
    db.save();
    return msg;
  }
};

export const QuizSessionsModel = {
  findAll(filter?: { status?: string; student?: Student }): QuizSession[] {
    let list = memoryDb.table('quiz_sessions') as QuizSession[];
    if (filter?.status) {
      list = list.filter(s => s.status === filter.status);
    }
    if (filter?.student) {
      const std = filter.student;
      list = list.filter(s => {
        if (s.target_type === 'ALL') return true;
        if (s.target_type === 'DEPARTMENT' && s.target_department === std.department) return true;
        if (s.target_type === 'COMMUNITY' && s.target_community === std.community) return true;
        return false;
      });
    }
    return [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },
  findById(id: string): QuizSession | undefined {
    return (memoryDb.table('quiz_sessions') as QuizSession[]).find(s => s.id === id);
  },
  findByPin(pin: string): QuizSession | undefined {
    const cleanPin = pin.trim();
    return (memoryDb.table('quiz_sessions') as QuizSession[]).find(s => s.pin === cleanPin);
  },
  create(data: Omit<QuizSession, 'id' | 'created_at' | 'pin'> & { pin?: string }): QuizSession {
    let pin = data.pin?.trim();
    if (!pin) {
      do {
        pin = Math.floor(100000 + Math.random() * 900000).toString();
      } while (this.findByPin(pin));
    }
    const newSession: QuizSession = {
      ...data,
      id: `qs-${Date.now()}`,
      pin,
      created_at: new Date().toISOString()
    };
    memoryDb.table('quiz_sessions').unshift(newSession);
    db.save();
    return newSession;
  },
  update(id: string, updates: Partial<QuizSession>): QuizSession | undefined {
    const list = memoryDb.table('quiz_sessions') as QuizSession[];
    const index = list.findIndex(s => s.id === id);
    if (index === -1) return undefined;
    const updated = { ...list[index], ...updates };
    list[index] = updated;
    db.save();
    return updated;
  },
  delete(id: string): boolean {
    const list = memoryDb.table('quiz_sessions') as QuizSession[];
    const index = list.findIndex(s => s.id === id);
    if (index !== -1) {
      list.splice(index, 1);
      const pList = memoryDb.table('quiz_session_participants') as QuizSessionParticipant[];
      for (let i = pList.length - 1; i >= 0; i--) {
        if (pList[i].session_id === id) {
          pList.splice(i, 1);
        }
      }
      db.save();
      return true;
    }
    return false;
  }
};

export const QuizSessionParticipantsModel = {
  findBySessionAndStudent(sessionId: string, studentId: string): QuizSessionParticipant | undefined {
    const list = memoryDb.table('quiz_session_participants') as QuizSessionParticipant[];
    return list.find(p => p.session_id === sessionId && p.student_id === studentId);
  },
  getParticipants(sessionId: string): QuizSessionParticipant[] {
    const list = memoryDb.table('quiz_session_participants') as QuizSessionParticipant[];
    return list.filter(p => p.session_id === sessionId);
  },
  ensureAssignedQuestions(session: QuizSession, participant: QuizSessionParticipant): string[] {
    if (participant.assigned_questions_json) {
      try {
        const parsed = JSON.parse(participant.assigned_questions_json);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        // Fall through to re-draw
      }
    }

    let assignedIds = session.question_ids || [];
    const drawCount = session.draw_count;

    if (drawCount && drawCount > 0 && assignedIds.length > drawCount) {
      // Pick a unique randomized subset of questions for this student
      const shuffled = [...assignedIds].sort(() => 0.5 - Math.random());
      assignedIds = shuffled.slice(0, drawCount);
    }

    participant.assigned_questions_json = JSON.stringify(assignedIds);
    db.save();
    return assignedIds;
  },
  join(sessionId: string, student: Student): QuizSessionParticipant {
    let participant = this.findBySessionAndStudent(sessionId, student.id);
    if (!participant) {
      participant = {
        id: `qsp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        session_id: sessionId,
        student_id: student.id,
        student_name: student.name,
        student_reg: student.student_id,
        student_department: student.department,
        student_community: student.community,
        joined_at: new Date().toISOString(),
        status: 'LOBBY',
        tab_switches_count: 0
      };
      const session = QuizSessionsModel.findById(sessionId);
      if (session) {
        this.ensureAssignedQuestions(session, participant);
      }
      memoryDb.table('quiz_session_participants').push(participant);
      db.save();
    } else {
      const session = QuizSessionsModel.findById(sessionId);
      if (session && !participant.assigned_questions_json) {
        this.ensureAssignedQuestions(session, participant);
      }
    }
    return participant;
  },
  recordTabSwitch(sessionId: string, studentId: string, eventType?: string): number {
    const participant = this.findBySessionAndStudent(sessionId, studentId);
    if (participant) {
      participant.tab_switches_count = (participant.tab_switches_count || 0) + 1;
      db.save();
      return participant.tab_switches_count;
    }
    return 0;
  },
  startQuiz(sessionId: string, studentId: string): QuizSessionParticipant | undefined {
    const participant = this.findBySessionAndStudent(sessionId, studentId);
    if (participant) {
      const session = QuizSessionsModel.findById(sessionId);
      if (session && !participant.assigned_questions_json) {
        this.ensureAssignedQuestions(session, participant);
      }
      if (participant.status === 'LOBBY' || !participant.started_at) {
        participant.status = 'IN_PROGRESS';
        participant.started_at = new Date().toISOString();
        db.save();
      }
    }
    return participant;
  },
  submit(
    sessionId: string,
    studentId: string,
    answers: { [questionId: string]: string },
    questions: Question[]
  ): QuizSessionParticipant | undefined {
    const participant = this.findBySessionAndStudent(sessionId, studentId);
    if (!participant) return undefined;

    let score = 0;
    let maxScore = 0;

    questions.forEach(q => {
      const marks = typeof q.marks === 'number' && !isNaN(q.marks) && q.marks > 0 ? q.marks : 1;
      maxScore += marks;
      const selected = answers[q.id];
      if (selected && isQuestionAnswerCorrect(q, selected)) {
        score += marks;
      }
    });

    const submittedAt = new Date();
    participant.submitted_at = submittedAt.toISOString();
    participant.status = 'SUBMITTED';
    participant.score = score;
    participant.max_score = maxScore;
    participant.percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    participant.answers_json = JSON.stringify(answers);

    if (participant.started_at) {
      const startTime = new Date(participant.started_at).getTime();
      participant.time_taken_seconds = Math.max(1, Math.round((submittedAt.getTime() - startTime) / 1000));
    } else {
      participant.started_at = participant.joined_at || submittedAt.toISOString();
      participant.time_taken_seconds = 1;
    }

    // Persist immediately and update ranks for all submitted participants in this session
    db.save();
    const leaderboard = this.getLeaderboard(sessionId);
    leaderboard.forEach(entry => {
      const p = this.findBySessionAndStudent(sessionId, entry.student_id);
      if (p) {
        p.rank = entry.rank;
      }
    });
    db.save();

    return participant;
  },
  getLeaderboard(sessionId: string) {
    const participants = this.getParticipants(sessionId).filter(p => p.status === 'SUBMITTED');
    participants.sort((a, b) => {
      // 1. Highest Score (Full marks / highest score wins)
      if ((b.score ?? 0) !== (a.score ?? 0)) {
        return (b.score ?? 0) - (a.score ?? 0);
      }
      // 2. Fastest Completion Time (Lowest time taken in seconds wins)
      const timeDiff = (a.time_taken_seconds ?? 999999) - (b.time_taken_seconds ?? 999999);
      if (timeDiff !== 0) {
        return timeDiff;
      }
      // 3. Proctoring Integrity (Fewer tab switches wins)
      const switchDiff = (a.tab_switches_count ?? 0) - (b.tab_switches_count ?? 0);
      if (switchDiff !== 0) {
        return switchDiff;
      }
      // 4. Submission Timestamp (Submitted earlier wins)
      const timeA = a.submitted_at ? new Date(a.submitted_at).getTime() : 0;
      const timeB = b.submitted_at ? new Date(b.submitted_at).getTime() : 0;
      return timeA - timeB;
    });
    return participants.map((p, idx) => ({
      rank: idx + 1,
      student_id: p.student_id,
      student_name: p.student_name,
      student_reg: p.student_reg,
      student_department: p.student_department,
      student_community: p.student_community,
      score: p.score ?? 0,
      max_score: p.max_score ?? 0,
      percentage: p.percentage ?? 0,
      time_taken_seconds: p.time_taken_seconds ?? 0,
      submitted_at: p.submitted_at,
      tab_switches_count: p.tab_switches_count ?? 0
    }));
  }
};

export const RestrictedEmailsModel = {
  findAll(): RestrictedEmail[] {
    const list = (memoryDb.table('restricted_emails') || []) as RestrictedEmail[];
    return [...list];
  },
  findByEmail(email: string): RestrictedEmail | undefined {
    if (!email) return undefined;
    const clean = email.trim().toLowerCase();
    const list = (memoryDb.table('restricted_emails') || []) as RestrictedEmail[];
    return list.find(r => r.email.toLowerCase() === clean);
  },
  findById(id: string): RestrictedEmail | undefined {
    const list = (memoryDb.table('restricted_emails') || []) as RestrictedEmail[];
    return list.find(r => r.id === id);
  },
  isEmailRestricted(email: string): boolean {
    if (!email) return false;
    const clean = email.trim().toLowerCase();
    // Super Admin can NEVER be restricted
    if (clean === 'pranavannur9659@gmail.com') return false;
    const list = (memoryDb.table('restricted_emails') || []) as RestrictedEmail[];
    return list.some(r => r.email.toLowerCase() === clean);
  },
  add(email: string, reason?: string, restrictedBy: string = 'pranavannur9659@gmail.com'): RestrictedEmail {
    if (!email || !email.trim()) {
      throw new Error('Email address is required to restrict access.');
    }
    const clean = email.trim().toLowerCase();
    if (clean === 'pranavannur9659@gmail.com') {
      throw new Error('The Super Admin (pranavannur9659@gmail.com) cannot be restricted.');
    }
    const existing = this.findByEmail(clean);
    if (existing) {
      if (reason && reason !== existing.reason) {
        existing.reason = reason;
        db.save();
      }
      return existing;
    }
    const newRestricted: RestrictedEmail = {
      id: `restr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      email: clean,
      reason: reason?.trim() || 'Restricted by Super Admin',
      restricted_by: restrictedBy,
      restricted_at: new Date().toISOString()
    };
    memoryDb.table('restricted_emails').push(newRestricted);
    db.save();
    return newRestricted;
  },
  remove(idOrEmail: string): boolean {
    if (!idOrEmail) return false;
    const clean = idOrEmail.trim().toLowerCase();
    const list = (memoryDb.table('restricted_emails') || []) as RestrictedEmail[];
    const index = list.findIndex(r => r.id === idOrEmail || r.email.toLowerCase() === clean);
    if (index !== -1) {
      list.splice(index, 1);
      db.save();
      return true;
    }
    return false;
  }
};

export const EmailLogsModel = {
  findAll(): EmailLog[] {
    const list = (memoryDb.table('email_logs') || []) as EmailLog[];
    return [...list].sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime());
  },
  findById(id: string): EmailLog | undefined {
    const list = (memoryDb.table('email_logs') || []) as EmailLog[];
    return list.find(l => l.id === id);
  },
  create(data: Omit<EmailLog, 'id' | 'sent_at'>): EmailLog {
    const newLog: EmailLog = {
      ...data,
      id: `elog-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sent_at: new Date().toISOString()
    };
    memoryDb.table('email_logs').push(newLog);
    db.save();
    return newLog;
  }
};

export const CertificateSettingsModel = {
  getList(): CertificateSettings[] {
    let list = memoryDb.table('certificate_settings') as CertificateSettings[] | undefined;
    if (!list) {
      list = [];
      (memoryDb as any).data.certificate_settings = list;
    }
    return list;
  },
  getSettings(): CertificateSettings {
    const list = this.getList();
    if (list.length === 0) {
      const initial: CertificateSettings = { 
        ...DEFAULT_CERTIFICATE_SETTINGS,
        updated_at: new Date().toISOString()
      };
      list.push(initial);
      db.save();
      return initial;
    }
    return { ...DEFAULT_CERTIFICATE_SETTINGS, ...list[0] };
  },
  updateSettings(updates: Partial<CertificateSettings>, updatedBy?: string): CertificateSettings {
    const current = this.getSettings();
    const updated: CertificateSettings = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString(),
      updated_by: updatedBy || current.updated_by
    };
    const list = this.getList();
    if (list.length === 0) {
      list.push(updated);
    } else {
      list[0] = updated;
    }
    db.save();
    return updated;
  },
  resetSettings(updatedBy?: string): CertificateSettings {
    const reset: CertificateSettings = {
      ...DEFAULT_CERTIFICATE_SETTINGS,
      updated_at: new Date().toISOString(),
      updated_by: updatedBy || 'ADMIN_RESET'
    };
    const list = this.getList();
    if (list.length === 0) {
      list.push(reset);
    } else {
      list[0] = reset;
    }
    db.save();
    return reset;
  }
};

function generateMeetingCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const pick = (len: number) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${pick(3)}-${pick(4)}-${pick(3)}`;
}

export const MeetingsModel = {
  getList(): Meeting[] {
    let list = memoryDb.table('meetings') as Meeting[] | undefined;
    if (!list) {
      list = [];
      (memoryDb as any).data.meetings = list;
    }
    return list;
  },

  findAll(filter?: { status?: string; student?: Student; admin?: Admin; isSuperAdmin?: boolean }): Meeting[] {
    let list = this.getList();

    if (filter?.status) {
      list = list.filter(m => m.status === filter.status);
    }

    if (filter?.student) {
      const std = filter.student;
      list = list.filter(m => {
        // Specifically invited students always have access
        if (m.invited_members && m.invited_members.some(im => im.id === std.id || im.email.toLowerCase() === std.email.toLowerCase())) {
          return true;
        }
        // Students can NEVER see or join ADMINS_ONLY meetings
        if (m.audience_type === 'ADMINS_ONLY') return false;
        if (m.audience_type === 'ALL' || m.audience_type === 'ALL_STUDENTS') return true;
        if (m.audience_type === 'SPECIFIC_STUDENTS') {
          if (m.target_department && m.target_department !== std.department) return false;
          if (m.target_year && Number(m.target_year) !== Number(std.year)) return false;
          return true;
        }
        return false;
      });
    } else if (filter?.admin) {
      if (!filter.isSuperAdmin) {
        // Regular admin sees: their own meetings, meetings for admins, meetings for all, or meetings they are explicitly invited to
        const adm = filter.admin;
        list = list.filter(m => 
          m.host_id === adm.id || 
          m.audience_type === 'ADMINS_ONLY' || 
          m.audience_type === 'ALL' ||
          (m.invited_members && m.invited_members.some(im => im.id === adm.id || im.email.toLowerCase() === adm.email.toLowerCase()))
        );
      }
      // Super admin sees all meetings
    }

    return [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  addInvitedMembers(id: string, members: Omit<InvitedMember, 'invited_at'>[]): Meeting | undefined {
    const list = this.getList();
    const index = list.findIndex(m => m.id === id);
    if (index === -1) return undefined;

    const currentMeeting = list[index];
    const existing = currentMeeting.invited_members || [];
    const now = new Date().toISOString();

    const newMembers: InvitedMember[] = [];
    for (const m of members) {
      if (!existing.some(ex => ex.id === m.id || ex.email.toLowerCase() === m.email.toLowerCase())) {
        newMembers.push({ ...m, invited_at: now });
      }
    }

    const updated: Meeting = {
      ...currentMeeting,
      invited_members: [...existing, ...newMembers],
      updated_at: now
    };

    list[index] = updated;
    db.save();
    return updated;
  },

  findById(id: string): Meeting | undefined {
    return this.getList().find(m => m.id === id);
  },

  findByCode(code: string): Meeting | undefined {
    const clean = code.trim().toLowerCase();
    return this.getList().find(m => m.code.toLowerCase() === clean);
  },

  create(data: Omit<Meeting, 'id' | 'created_at' | 'updated_at' | 'code'> & { code?: string }): Meeting {
    let code = data.code?.trim().toLowerCase();
    if (!code) {
      do {
        code = generateMeetingCode();
      } while (this.findByCode(code));
    }

    const now = new Date().toISOString();
    const newMeeting: Meeting = {
      ...data,
      id: `meet-${Date.now()}-${uuidv4().substring(0, 6)}`,
      code,
      status: data.status || 'SCHEDULED',
      allow_screen_share: data.allow_screen_share ?? true,
      allow_student_chat: data.allow_student_chat ?? true,
      mute_on_entry: data.mute_on_entry ?? false,
      created_at: now,
      updated_at: now
    };

    this.getList().unshift(newMeeting);
    db.save();
    return newMeeting;
  },

  update(id: string, updates: Partial<Meeting>): Meeting | undefined {
    const list = this.getList();
    const index = list.findIndex(m => m.id === id);
    if (index === -1) return undefined;

    const updated: Meeting = {
      ...list[index],
      ...updates,
      updated_at: new Date().toISOString()
    };

    list[index] = updated;
    db.save();
    return updated;
  },

  delete(id: string): boolean {
    const list = this.getList();
    const index = list.findIndex(m => m.id === id);
    if (index === -1) return false;

    list.splice(index, 1);

    // Also purge participants for this meeting
    let pList = memoryDb.table('meeting_participants') as MeetingParticipant[] | undefined;
    if (pList) {
      for (let i = pList.length - 1; i >= 0; i--) {
        if (pList[i].meeting_id === id) {
          pList.splice(i, 1);
        }
      }
    }

    db.save();
    return true;
  }
};

export const MeetingParticipantsModel = {
  getList(): MeetingParticipant[] {
    let list = memoryDb.table('meeting_participants') as MeetingParticipant[] | undefined;
    if (!list) {
      list = [];
      (memoryDb as any).data.meeting_participants = list;
    }
    return list;
  },

  getParticipants(meetingId: string): MeetingParticipant[] {
    return this.getList().filter(p => p.meeting_id === meetingId);
  },

  recordJoin(data: Omit<MeetingParticipant, 'id'>): MeetingParticipant {
    const list = this.getList();
    // Check if user already has an active session in this meeting
    const existing = list.find(p => p.meeting_id === data.meeting_id && p.user_id === data.user_id && !p.left_at);
    if (existing) {
      return existing;
    }

    const participant: MeetingParticipant = {
      ...data,
      id: `mp-${Date.now()}-${uuidv4().substring(0, 6)}`,
      joined_at: data.joined_at || new Date().toISOString()
    };

    list.push(participant);
    db.save();
    return participant;
  },

  recordLeave(meetingId: string, userId: string): MeetingParticipant | undefined {
    const list = this.getList();
    const existing = list.find(p => p.meeting_id === meetingId && p.user_id === userId && !p.left_at);
    if (!existing) return undefined;

    const now = new Date();
    existing.left_at = now.toISOString();
    const joined = new Date(existing.joined_at);
    existing.duration_seconds = Math.max(0, Math.floor((now.getTime() - joined.getTime()) / 1000));

    db.save();
    return existing;
  },

  getUserHistory(userId: string): MeetingParticipant[] {
    return this.getList().filter(p => p.user_id === userId);
  }
};

export const MeetingSettingsModel = {
  getList(): MeetingSettings[] {
    let list = memoryDb.table('meeting_settings') as MeetingSettings[] | undefined;
    if (!list) {
      list = [];
      (memoryDb as any).data.meeting_settings = list;
    }
    return list;
  },

  getSettings(): MeetingSettings {
    const list = this.getList();
    if (list.length === 0) {
      const initial: MeetingSettings = {
        ...DEFAULT_MEETING_SETTINGS,
        updated_at: new Date().toISOString()
      };
      list.push(initial);
      db.save();
      return initial;
    }
    return { ...DEFAULT_MEETING_SETTINGS, ...list[0] };
  },

  updateSettings(updates: Partial<MeetingSettings>, updatedBy?: string): MeetingSettings {
    const current = this.getSettings();
    const updated: MeetingSettings = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString(),
      updated_by: updatedBy || current.updated_by
    };

    const list = this.getList();
    if (list.length === 0) {
      list.push(updated);
    } else {
      list[0] = updated;
    }
    db.save();
    return updated;
  },

  canAdminCreateMeeting(adminId: string, adminEmail: string, isSuperAdmin?: boolean): { allowed: boolean; reason?: string } {
    const isSuper = adminEmail.toLowerCase() === 'pranavannur9659@gmail.com' || Boolean(isSuperAdmin);
    if (isSuper) {
      return { allowed: true };
    }

    const settings = this.getSettings();
    if (!settings.is_enabled) {
      return { 
        allowed: false, 
        reason: 'The Live Meeting feature has been temporarily disabled by the Super Admin.' 
      };
    }

    if (settings.allow_all_admins) {
      return { allowed: true };
    }

    if (settings.permitted_admin_ids && settings.permitted_admin_ids.includes(adminId)) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: 'Access Denied: You do not have permission to create meetings. Meeting creation privileges are controlled and granted by the Super Admin.'
    };
  }
};

// ============================================================================
// GROUP DISCUSSION (GD) SESSIONS & PEER EVALUATION SYSTEM
// ============================================================================

export interface GdQuestion {
  id: string;
  question_text: string;
  order: number;
}

export interface GdSession {
  id: string;
  title: string;
  topic: string;
  description?: string;
  pin: string;
  max_participants: number; // Configured by admin: how many should participate (e.g. 10 candidates)
  target_type: 'ALL' | 'DEPARTMENT' | 'COMMUNITY';
  target_department?: string;
  target_community?: string;
  duration_minutes: number;
  questions: GdQuestion[];
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  created_by: string;
  created_at: string;
  is_results_published?: boolean;
  active_speaker_id?: string | null;
  speaker_started_at?: string | null;
  current_speaker_index?: number;
  speaker_order?: string[]; // Array of student_id in speaking order
  session_stage?: 'WAITING' | 'SPEAKING' | 'RATING' | 'COMPLETED';
  speaker_duration_limit_seconds?: number; // e.g. 120s or 180s
}

export interface GdParticipant {
  id: string;
  session_id: string;
  student_id: string;
  student_name: string;
  student_reg: string;
  student_department: string;
  student_community: string;
  joined_at: string;
  status: 'JOINED' | 'EVALUATION_SUBMITTED' | 'SPOKEN';
  submitted_at?: string;
  speaking_time_seconds?: number; // Stored speaking duration in seconds
  speaking_order?: number; // 1, 2, ... 10
  speaking_status?: 'WAITING' | 'SPEAKING' | 'SPOKEN';
  average_score_out_of_10?: number | null;
  total_marks_received?: number | null;
  ratings_count?: number;
  question_scores?: {
    [questionId: string]: {
      average_score: number;
      total_score: number;
      evaluations_count: number;
    };
  };
  rank?: number | null;
  average_rank?: number | null;
  total_points?: number | null;
  question_ranks?: {
    [questionId: string]: {
      average_rank: number;
      rank_position: number;
      total_points: number;
      average_score_out_of_10?: number;
    };
  };
}

export interface GdSpeakerRating {
  id: string;
  session_id: string;
  speaker_student_id: string;
  evaluator_student_id: string;
  evaluator_student_name: string;
  question_id: string;
  marks_out_of_10: number; // 1 to 10 points rating
  feedback?: string;
  submitted_at: string;
}

export interface GdPeerEvaluation {
  id: string;
  session_id: string;
  evaluator_student_id: string;
  evaluator_student_name: string;
  question_id: string;
  rankings: Array<{
    target_student_id: string;
    target_student_name: string;
    rank: number; // 1 (best) to M
  }>;
  submitted_at: string;
}

export interface GdLeaderboardEntry {
  rank: number;
  student_id: string;
  student_name: string;
  student_reg: string;
  student_department: string;
  student_community: string;
  average_rank: number;
  total_points: number;
  average_score_out_of_10?: number;
  total_marks?: number;
  speaking_time_seconds?: number;
  speaking_time_formatted?: string;
  question_ranks: {
    [questionId: string]: {
      average_rank: number;
      rank_position: number;
      total_points: number;
      average_score_out_of_10?: number;
    };
  };
}

export const GdSessionsModel = {
  findAll(filter?: { status?: string; student?: Student }): GdSession[] {
    let list = memoryDb.table('gd_sessions') as GdSession[];
    if (filter?.status) {
      list = list.filter(s => s.status === filter.status);
    }
    if (filter?.student) {
      const std = filter.student;
      list = list.filter(s => {
        if (s.target_type === 'ALL') return true;
        if (s.target_type === 'DEPARTMENT' && s.target_department === std.department) return true;
        if (s.target_type === 'COMMUNITY' && s.target_community === std.community) return true;
        return false;
      });
    }
    return [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  findById(id: string): GdSession | undefined {
    return (memoryDb.table('gd_sessions') as GdSession[]).find(s => s.id === id);
  },

  findByPin(pin: string): GdSession | undefined {
    const cleanPin = pin.trim();
    return (memoryDb.table('gd_sessions') as GdSession[]).find(s => s.pin === cleanPin);
  },

  create(data: Omit<GdSession, 'id' | 'created_at' | 'pin'> & { pin?: string }): GdSession {
    let pin = data.pin?.trim();
    if (!pin) {
      do {
        pin = Math.floor(100000 + Math.random() * 900000).toString();
      } while (this.findByPin(pin));
    }
    const newSession: GdSession = {
      ...data,
      id: `gd-${Date.now()}`,
      pin,
      created_at: new Date().toISOString(),
      is_results_published: false,
      session_stage: 'WAITING',
      speaker_order: [],
      current_speaker_index: 0,
      active_speaker_id: null,
      speaker_started_at: null,
      speaker_duration_limit_seconds: data.speaker_duration_limit_seconds || 120
    };
    memoryDb.table('gd_sessions').unshift(newSession);
    db.save();
    return newSession;
  },

  update(id: string, updates: Partial<GdSession>): GdSession | undefined {
    const list = memoryDb.table('gd_sessions') as GdSession[];
    const index = list.findIndex(s => s.id === id);
    if (index === -1) return undefined;
    const updated = { ...list[index], ...updates };
    list[index] = updated;
    db.save();
    return updated;
  },

  delete(id: string): boolean {
    const list = memoryDb.table('gd_sessions') as GdSession[];
    const index = list.findIndex(s => s.id === id);
    if (index !== -1) {
      list.splice(index, 1);
      const pList = memoryDb.table('gd_participants') as GdParticipant[];
      for (let i = pList.length - 1; i >= 0; i--) {
        if (pList[i].session_id === id) pList.splice(i, 1);
      }
      const eList = memoryDb.table('gd_peer_evaluations') as GdPeerEvaluation[];
      for (let i = eList.length - 1; i >= 0; i--) {
        if (eList[i].session_id === id) eList.splice(i, 1);
      }
      const rList = memoryDb.table('gd_speaker_ratings') as GdSpeakerRating[];
      for (let i = rList.length - 1; i >= 0; i--) {
        if (rList[i].session_id === id) rList.splice(i, 1);
      }
      db.save();
      return true;
    }
    return false;
  },

  startSpeakerTurn(sessionId: string, studentId: string): { session: GdSession; speaker?: GdParticipant } | undefined {
    const session = this.findById(sessionId);
    if (!session) return undefined;

    const participants = GdParticipantsModel.getParticipants(sessionId);
    const speaker = participants.find(p => p.student_id === studentId);
    if (!speaker) return undefined;

    // Build/maintain speaker sequence
    if (!session.speaker_order || session.speaker_order.length === 0) {
      session.speaker_order = participants.map(p => p.student_id);
    }
    if (!session.speaker_order.includes(studentId)) {
      session.speaker_order.push(studentId);
    }

    const speakerIdx = session.speaker_order.indexOf(studentId);
    session.current_speaker_index = speakerIdx >= 0 ? speakerIdx : 0;
    session.active_speaker_id = studentId;
    session.speaker_started_at = new Date().toISOString();
    session.session_stage = 'SPEAKING';
    if (session.status === 'SCHEDULED') {
      session.status = 'ACTIVE';
    }

    // Set speaking status for speaker and reset any previous active speaker
    for (const p of participants) {
      if (p.student_id === studentId) {
        p.speaking_status = 'SPEAKING';
      } else if (p.speaking_status === 'SPEAKING') {
        p.speaking_status = 'SPOKEN';
      }
    }

    db.save();
    return { session, speaker };
  },

  stopSpeakerTurn(sessionId: string, studentId: string, durationSeconds?: number): { session: GdSession; speaker?: GdParticipant } | undefined {
    const session = this.findById(sessionId);
    if (!session) return undefined;

    const participants = GdParticipantsModel.getParticipants(sessionId);
    const speaker = participants.find(p => p.student_id === studentId);
    if (!speaker) return undefined;

    let elapsed = 0;
    if (typeof durationSeconds === 'number' && durationSeconds >= 0) {
      elapsed = durationSeconds;
    } else if (session.speaker_started_at) {
      elapsed = Math.max(1, Math.round((Date.now() - new Date(session.speaker_started_at).getTime()) / 1000));
    }

    // Store participant's speaking duration
    speaker.speaking_time_seconds = elapsed;
    speaker.speaking_status = 'SPOKEN';
    session.session_stage = 'RATING';
    session.speaker_started_at = null;

    db.save();
    return { session, speaker };
  },

  submitSpeakerRatings(
    sessionId: string,
    evaluatorStudentId: string,
    evaluatorStudentName: string,
    speakerStudentId: string,
    ratings: Array<{ question_id: string; marks_out_of_10: number; feedback?: string }>
  ): { success: boolean; speaker?: GdParticipant } {
    const session = this.findById(sessionId);
    if (!session) return { success: false };

    const speaker = GdParticipantsModel.findBySessionAndStudent(sessionId, speakerStudentId);
    if (!speaker) return { success: false };

    if (evaluatorStudentId === speakerStudentId) {
      return { success: false };
    }

    const ratingsTable = memoryDb.table('gd_speaker_ratings') as GdSpeakerRating[];

    // Remove any previous ratings from this evaluator for this speaker in this session
    for (let i = ratingsTable.length - 1; i >= 0; i--) {
      if (
        ratingsTable[i].session_id === sessionId &&
        ratingsTable[i].speaker_student_id === speakerStudentId &&
        ratingsTable[i].evaluator_student_id === evaluatorStudentId
      ) {
        ratingsTable.splice(i, 1);
      }
    }

    const now = new Date().toISOString();
    for (const r of ratings) {
      const raw = r.marks_out_of_10 !== undefined ? r.marks_out_of_10 : (r as any).score_out_of_10;
      const cleanMarks = Math.max(1, Math.min(10, Number(raw) || 5));
      ratingsTable.push({
        id: `gdsr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        session_id: sessionId,
        speaker_student_id: speakerStudentId,
        evaluator_student_id: evaluatorStudentId,
        evaluator_student_name: evaluatorStudentName,
        question_id: r.question_id,
        marks_out_of_10: cleanMarks,
        feedback: r.feedback?.trim() || '',
        submitted_at: now
      });
    }

    // Recompute speaker aggregate metrics
    const allRatingsForSpeaker = ratingsTable.filter(
      r => r.session_id === sessionId && r.speaker_student_id === speakerStudentId
    );

    const evaluatorsSet = new Set(allRatingsForSpeaker.map(r => r.evaluator_student_id));
    speaker.ratings_count = evaluatorsSet.size;

    const totalMarks = allRatingsForSpeaker.reduce((sum, r) => sum + r.marks_out_of_10, 0);
    speaker.total_marks_received = totalMarks;
    speaker.average_score_out_of_10 = allRatingsForSpeaker.length > 0
      ? Number((totalMarks / allRatingsForSpeaker.length).toFixed(2))
      : null;

    const qScores: { [qId: string]: { average_score: number; total_score: number; evaluations_count: number } } = {};
    for (const q of (session.questions || [])) {
      const qRatings = allRatingsForSpeaker.filter(r => r.question_id === q.id);
      const qTotal = qRatings.reduce((sum, r) => sum + r.marks_out_of_10, 0);
      qScores[q.id] = {
        total_score: qTotal,
        evaluations_count: qRatings.length,
        average_score: qRatings.length > 0 ? Number((qTotal / qRatings.length).toFixed(2)) : 0
      };
    }
    speaker.question_scores = qScores;

    db.save();
    return { success: true, speaker };
  },

  nextSpeakerTurn(sessionId: string): { session: GdSession; nextSpeaker?: GdParticipant; completed?: boolean } | undefined {
    const session = this.findById(sessionId);
    if (!session) return undefined;

    const participants = GdParticipantsModel.getParticipants(sessionId);
    if (participants.length === 0) return undefined;

    let order = session.speaker_order || [];
    if (order.length === 0) {
      order = participants.map(p => p.student_id);
      session.speaker_order = order;
    }

    let nextStudentId: string | undefined = undefined;
    const currentIdx = session.current_speaker_index ?? -1;

    for (let i = currentIdx + 1; i < order.length; i++) {
      const candidate = participants.find(p => p.student_id === order[i]);
      if (candidate && candidate.speaking_status !== 'SPOKEN') {
        nextStudentId = candidate.student_id;
        session.current_speaker_index = i;
        break;
      }
    }

    if (!nextStudentId) {
      for (let i = 0; i <= currentIdx; i++) {
        const candidate = participants.find(p => p.student_id === order[i]);
        if (candidate && candidate.speaking_status !== 'SPOKEN') {
          nextStudentId = candidate.student_id;
          session.current_speaker_index = i;
          break;
        }
      }
    }

    if (!nextStudentId) {
      session.session_stage = 'COMPLETED';
      session.active_speaker_id = null;
      session.speaker_started_at = null;
      session.is_results_published = true;
      GdParticipantsModel.calculateLeaderboard(sessionId);
      db.save();
      return { session, completed: true };
    }

    return this.startSpeakerTurn(sessionId, nextStudentId);
  },

  resetSpeakerTurns(sessionId: string): GdSession | undefined {
    const session = this.findById(sessionId);
    if (!session) return undefined;

    session.session_stage = 'WAITING';
    session.active_speaker_id = null;
    session.speaker_started_at = null;
    session.current_speaker_index = 0;

    const participants = GdParticipantsModel.getParticipants(sessionId);
    for (const p of participants) {
      p.speaking_status = 'WAITING';
      p.speaking_time_seconds = 0;
      p.average_score_out_of_10 = null;
      p.total_marks_received = null;
      p.ratings_count = 0;
      p.question_scores = undefined;
    }

    const ratingsTable = memoryDb.table('gd_speaker_ratings') as GdSpeakerRating[];
    for (let i = ratingsTable.length - 1; i >= 0; i--) {
      if (ratingsTable[i].session_id === sessionId) {
        ratingsTable.splice(i, 1);
      }
    }

    db.save();
    return session;
  }
};

export const GdParticipantsModel = {
  getParticipants(sessionId: string): GdParticipant[] {
    const list = memoryDb.table('gd_participants') as GdParticipant[];
    return list.filter(p => p.session_id === sessionId);
  },

  findBySessionAndStudent(sessionId: string, studentId: string): GdParticipant | undefined {
    const list = memoryDb.table('gd_participants') as GdParticipant[];
    return list.find(p => p.session_id === sessionId && p.student_id === studentId);
  },

  join(sessionId: string, student: Student): { participant?: GdParticipant; error?: string } {
    const session = GdSessionsModel.findById(sessionId);
    if (!session) {
      return { error: 'GD session not found.' };
    }

    if (session.status === 'COMPLETED' || session.status === 'CANCELLED') {
      return { error: 'This GD session is no longer active.' };
    }

    const currentParticipants = this.getParticipants(sessionId);
    const existing = currentParticipants.find(p => p.student_id === student.id);
    if (existing) {
      return { participant: existing };
    }

    if (session.max_participants && currentParticipants.length >= session.max_participants) {
      return {
        error: `This GD session has reached its full participant capacity (${session.max_participants} students limit).`
      };
    }

    const orderNumber = currentParticipants.length + 1;
    const newParticipant: GdParticipant = {
      id: `gdp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      session_id: sessionId,
      student_id: student.id,
      student_name: student.name,
      student_reg: student.student_id,
      student_department: student.department,
      student_community: student.community,
      joined_at: new Date().toISOString(),
      status: 'JOINED',
      speaking_status: 'WAITING',
      speaking_order: orderNumber,
      speaking_time_seconds: 0
    };

    if (!session.speaker_order) session.speaker_order = [];
    if (!session.speaker_order.includes(student.id)) {
      session.speaker_order.push(student.id);
    }

    memoryDb.table('gd_participants').push(newParticipant);
    db.save();
    return { participant: newParticipant };
  },

  submitEvaluations(
    sessionId: string,
    studentId: string,
    studentName: string,
    evaluationsByQuestion: {
      [questionId: string]: Array<{
        target_student_id: string;
        target_student_name: string;
        rank: number;
      }>;
    }
  ): boolean {
    const participant = this.findBySessionAndStudent(sessionId, studentId);
    if (!participant) return false;

    const evaluationsTable = memoryDb.table('gd_peer_evaluations') as GdPeerEvaluation[];

    for (let i = evaluationsTable.length - 1; i >= 0; i--) {
      if (evaluationsTable[i].session_id === sessionId && evaluationsTable[i].evaluator_student_id === studentId) {
        evaluationsTable.splice(i, 1);
      }
    }

    const now = new Date().toISOString();
    for (const [qId, rankings] of Object.entries(evaluationsByQuestion)) {
      evaluationsTable.push({
        id: `gde-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        session_id: sessionId,
        evaluator_student_id: studentId,
        evaluator_student_name: studentName,
        question_id: qId,
        rankings,
        submitted_at: now
      });
    }

    participant.status = 'EVALUATION_SUBMITTED';
    participant.submitted_at = now;
    db.save();
    return true;
  },

  calculateLeaderboard(sessionId: string): GdLeaderboardEntry[] {
    const session = GdSessionsModel.findById(sessionId);
    if (!session) return [];

    const participants = this.getParticipants(sessionId);
    if (participants.length === 0) return [];

    const evaluations = (memoryDb.table('gd_peer_evaluations') as GdPeerEvaluation[])
      .filter(e => e.session_id === sessionId);

    const speakerRatings = (memoryDb.table('gd_speaker_ratings') as GdSpeakerRating[])
      .filter(r => r.session_id === sessionId);

    const questions = session.questions || [];
    const N = participants.length;

    const formatSpeakingTime = (sec?: number): string => {
      if (!sec || sec <= 0) return '00:00';
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    interface ParticipantStats {
      student_id: string;
      student_name: string;
      student_reg: string;
      student_department: string;
      student_community: string;
      speaking_time_seconds: number;
      speaking_time_formatted: string;
      average_score_out_of_10: number;
      total_marks: number;
      question_ranks: {
        [qId: string]: {
          average_rank: number;
          rank_position: number;
          total_points: number;
          votes_count: number;
          average_score_out_of_10?: number;
        };
      };
      overall_avg_rank: number;
      overall_points: number;
    }

    const statsMap: { [studentId: string]: ParticipantStats } = {};
    for (const p of participants) {
      statsMap[p.student_id] = {
        student_id: p.student_id,
        student_name: p.student_name,
        student_reg: p.student_reg,
        student_department: p.student_department,
        student_community: p.student_community,
        speaking_time_seconds: p.speaking_time_seconds || 0,
        speaking_time_formatted: formatSpeakingTime(p.speaking_time_seconds),
        average_score_out_of_10: p.average_score_out_of_10 || 0,
        total_marks: p.total_marks_received || 0,
        question_ranks: {},
        overall_avg_rank: 0,
        overall_points: 0
      };
    }

    const hasSpeakerRatings = speakerRatings.length > 0;

    for (const q of questions) {
      const qEvals = evaluations.filter(e => e.question_id === q.id);
      const qRatings = speakerRatings.filter(r => r.question_id === q.id);

      const ranksReceived: { [studentId: string]: number[] } = {};
      for (const p of participants) {
        ranksReceived[p.student_id] = [];
      }

      for (const ev of qEvals) {
        for (const r of ev.rankings) {
          if (ranksReceived[r.target_student_id]) {
            ranksReceived[r.target_student_id].push(r.rank);
          }
        }
      }

      const questionScores: Array<{ student_id: string; avg_rank: number; points: number; avg_marks: number }> = [];

      for (const p of participants) {
        const votes = ranksReceived[p.student_id] || [];
        const avg = votes.length > 0 ? (votes.reduce((a, b) => a + b, 0) / votes.length) : (N / 2);
        const totalPoints = votes.reduce((sum, r) => sum + Math.max(1, (N - r + 1)), 0);

        // 10-point ratings for this question
        const ratingsForStudent = qRatings.filter(r => r.speaker_student_id === p.student_id);
        const avgMarks = ratingsForStudent.length > 0
          ? Number((ratingsForStudent.reduce((s, r) => s + r.marks_out_of_10, 0) / ratingsForStudent.length).toFixed(2))
          : (p.average_score_out_of_10 || 0);

        questionScores.push({
          student_id: p.student_id,
          avg_rank: Number(avg.toFixed(2)),
          points: totalPoints,
          avg_marks: avgMarks
        });
      }

      // If we have 10-point ratings, prioritize highest marks, else rank-based
      if (hasSpeakerRatings) {
        questionScores.sort((a, b) => b.avg_marks - a.avg_marks || a.avg_rank - b.avg_rank);
      } else {
        questionScores.sort((a, b) => a.avg_rank - b.avg_rank || b.points - a.points);
      }

      questionScores.forEach((qs, idx) => {
        const rankPos = idx + 1;
        statsMap[qs.student_id].question_ranks[q.id] = {
          average_rank: qs.avg_rank,
          rank_position: rankPos,
          total_points: qs.points,
          votes_count: (ranksReceived[qs.student_id] || []).length,
          average_score_out_of_10: qs.avg_marks
        };
      });
    }

    const overallList: Array<ParticipantStats> = Object.values(statsMap);

    for (const item of overallList) {
      let sumAvgRanks = 0;
      let totalPts = 0;
      const qCount = questions.length || 1;

      for (const q of questions) {
        const qr = item.question_ranks[q.id];
        if (qr) {
          sumAvgRanks += qr.rank_position;
          totalPts += qr.total_points;
        }
      }

      item.overall_avg_rank = Number((sumAvgRanks / qCount).toFixed(2));
      item.overall_points = totalPts;

      // Overall average marks out of 10 from speaker ratings
      const stRatings = speakerRatings.filter(r => r.speaker_student_id === item.student_id);
      if (stRatings.length > 0) {
        const sumMarks = stRatings.reduce((s, r) => s + r.marks_out_of_10, 0);
        item.total_marks = sumMarks;
        item.average_score_out_of_10 = Number((sumMarks / stRatings.length).toFixed(2));
      }
    }

    // Sort overall: if 10-point marks exist, sort by highest marks first; otherwise lowest average rank
    if (hasSpeakerRatings) {
      overallList.sort((a, b) => b.average_score_out_of_10 - a.average_score_out_of_10 || b.total_marks - a.total_marks || a.overall_avg_rank - b.overall_avg_rank);
    } else {
      overallList.sort((a, b) => a.overall_avg_rank - b.overall_avg_rank || b.overall_points - a.overall_points);
    }

    const leaderboard: GdLeaderboardEntry[] = overallList.map((st, idx) => ({
      rank: idx + 1,
      student_id: st.student_id,
      student_name: st.student_name,
      student_reg: st.student_reg,
      student_department: st.student_department,
      student_community: st.student_community,
      average_rank: st.overall_avg_rank,
      total_points: st.overall_points,
      average_score_out_of_10: st.average_score_out_of_10,
      total_marks: st.total_marks,
      speaking_time_seconds: st.speaking_time_seconds,
      speaking_time_formatted: st.speaking_time_formatted,
      question_ranks: st.question_ranks
    }));

    leaderboard.forEach(entry => {
      const p = this.findBySessionAndStudent(sessionId, entry.student_id);
      if (p) {
        p.rank = entry.rank;
        p.average_rank = entry.average_rank;
        p.total_points = entry.total_points;
        p.average_score_out_of_10 = entry.average_score_out_of_10;
        p.total_marks_received = entry.total_marks;
        p.question_ranks = entry.question_ranks;
      }
    });

    db.save();
    return leaderboard;
  }
};

export interface PromptSession {
  id: string;
  title: string;
  description: string;
  task_objective?: string;
  target_community?: string;
  target_department?: string;
  target_year?: number;
  status: 'DRAFT' | 'ACTIVE' | 'EVALUATED' | 'PUBLISHED' | 'ARCHIVED';
  results_published: boolean;
  published_at?: string;
  created_by: string;
  created_at: string;
  updated_at?: string;
  rubrics?: {
    clarity_weight?: number;
    persona_weight?: number;
    constraints_weight?: number;
    format_weight?: number;
    security_weight?: number;
  };
}

export interface PromptSubmissionMistake {
  id: string;
  category: 'CLARITY' | 'CONSTRAINTS' | 'PERSONA' | 'FORMAT' | 'SECURITY';
  title: string;
  description: string;
  severity: 'CRITICAL' | 'WARNING' | 'SUGGESTION';
  penaltyMarks: number;
  howToFix: string;
}

export interface PromptSubmission {
  id: string;
  session_id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  student_reg: string;
  student_department?: string;
  student_year?: number;
  submitted_prompt: string;
  score: number;
  grade: 'S' | 'A+' | 'A' | 'B' | 'C' | 'D';
  metrics: {
    clarityAndSpecificity: number;
    personaAndRole: number;
    constraintsAndGuardrails: number;
    outputFormatting: number;
    securityAndRobustness: number;
  };
  mistakes: PromptSubmissionMistake[];
  strengths: string[];
  suggestions: string[];
  improved_prompt: string;
  summary_feedback: string;
  engine_used: 'GEMINI_AI' | 'HEURISTIC_RULE_ENGINE';
  is_published: boolean;
  published_at?: string;
  notification_sent?: boolean;
  email_sent?: boolean;
  created_at: string;
  updated_at?: string;
}

export const PromptSessionsModel = {
  getAll: (): PromptSession[] => {
    return (db.getTable('prompt_sessions') || []) as PromptSession[];
  },

  getActive: (): PromptSession[] => {
    const list = (db.getTable('prompt_sessions') || []) as PromptSession[];
    return list.filter(s => s.status === 'ACTIVE' || s.status === 'PUBLISHED');
  },

  findById: (id: string): PromptSession | undefined => {
    const list = (db.getTable('prompt_sessions') || []) as PromptSession[];
    return list.find(s => s.id === id);
  },

  create: (data: Omit<PromptSession, 'id' | 'created_at' | 'results_published'> & Partial<PromptSession>): PromptSession => {
    const list = (db.getTable('prompt_sessions') || []) as PromptSession[];
    const now = new Date().toISOString();
    const newSession: PromptSession = {
      id: data.id || uuidv4(),
      title: data.title,
      description: data.description,
      task_objective: data.task_objective || '',
      target_community: data.target_community || '',
      target_department: data.target_department || '',
      target_year: data.target_year || 0,
      status: data.status || 'ACTIVE',
      results_published: false,
      created_by: data.created_by || 'Admin',
      created_at: now,
      updated_at: now,
      rubrics: data.rubrics || {}
    };
    list.push(newSession);
    db.save();
    return newSession;
  },

  update: (id: string, updates: Partial<PromptSession>): PromptSession | null => {
    const list = (db.getTable('prompt_sessions') || []) as PromptSession[];
    const idx = list.findIndex(s => s.id === id);
    if (idx === -1) return null;
    list[idx] = {
      ...list[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    db.save();
    return list[idx];
  },

  delete: (id: string): boolean => {
    const list = (db.getTable('prompt_sessions') || []) as PromptSession[];
    const idx = list.findIndex(s => s.id === id);
    if (idx === -1) return false;
    list.splice(idx, 1);
    db.save();
    return true;
  },

  publishResults: (id: string): PromptSession | null => {
    const list = (db.getTable('prompt_sessions') || []) as PromptSession[];
    const idx = list.findIndex(s => s.id === id);
    if (idx === -1) return null;
    list[idx].results_published = true;
    list[idx].status = 'PUBLISHED';
    list[idx].published_at = new Date().toISOString();
    list[idx].updated_at = new Date().toISOString();
    db.save();
    return list[idx];
  }
};

export const PromptSubmissionsModel = {
  getAll: (): PromptSubmission[] => {
    return (db.getTable('prompt_submissions') || []) as PromptSubmission[];
  },

  findBySession: (sessionId: string): PromptSubmission[] => {
    const list = (db.getTable('prompt_submissions') || []) as PromptSubmission[];
    return list.filter(sub => sub.session_id === sessionId);
  },

  findByStudent: (studentId: string): PromptSubmission[] => {
    const list = (db.getTable('prompt_submissions') || []) as PromptSubmission[];
    return list.filter(sub => sub.student_id === studentId);
  },

  findBySessionAndStudent: (sessionId: string, studentId: string): PromptSubmission | undefined => {
    const list = (db.getTable('prompt_submissions') || []) as PromptSubmission[];
    return list.find(sub => sub.session_id === sessionId && sub.student_id === studentId);
  },

  findById: (id: string): PromptSubmission | undefined => {
    const list = (db.getTable('prompt_submissions') || []) as PromptSubmission[];
    return list.find(sub => sub.id === id);
  },

  createOrUpdate: (data: Omit<PromptSubmission, 'id' | 'created_at'> & Partial<PromptSubmission>): PromptSubmission => {
    const list = (db.getTable('prompt_submissions') || []) as PromptSubmission[];
    const now = new Date().toISOString();
    const existingIdx = list.findIndex(s => s.session_id === data.session_id && s.student_id === data.student_id);

    if (existingIdx !== -1) {
      list[existingIdx] = {
        ...list[existingIdx],
        ...data,
        updated_at: now
      };
      db.save();
      return list[existingIdx];
    } else {
      const newSubmission: PromptSubmission = {
        id: data.id || uuidv4(),
        session_id: data.session_id,
        student_id: data.student_id,
        student_name: data.student_name,
        student_email: data.student_email,
        student_reg: data.student_reg,
        student_department: data.student_department || '',
        student_year: data.student_year || 0,
        submitted_prompt: data.submitted_prompt,
        score: data.score,
        grade: data.grade,
        metrics: data.metrics,
        mistakes: data.mistakes || [],
        strengths: data.strengths || [],
        suggestions: data.suggestions || [],
        improved_prompt: data.improved_prompt,
        summary_feedback: data.summary_feedback,
        engine_used: data.engine_used,
        is_published: data.is_published ?? false,
        published_at: data.published_at,
        notification_sent: data.notification_sent ?? false,
        email_sent: data.email_sent ?? false,
        created_at: now,
        updated_at: now
      };
      list.push(newSubmission);
      db.save();
      return newSubmission;
    }
  },

  markPublishedForSession: (sessionId: string): PromptSubmission[] => {
    const list = (db.getTable('prompt_submissions') || []) as PromptSubmission[];
    const now = new Date().toISOString();
    const updated: PromptSubmission[] = [];

    list.forEach(sub => {
      if (sub.session_id === sessionId) {
        sub.is_published = true;
        sub.published_at = now;
        sub.updated_at = now;
        updated.push(sub);
      }
    });

    db.save();
    return updated;
  },

  update: (id: string, updates: Partial<PromptSubmission>): PromptSubmission | null => {
    const list = (db.getTable('prompt_submissions') || []) as PromptSubmission[];
    const idx = list.findIndex(sub => sub.id === id);
    if (idx === -1) return null;
    list[idx] = {
      ...list[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    db.save();
    return list[idx];
  },

  deleteBySession: (sessionId: string): number => {
    const list = (db.getTable('prompt_submissions') || []) as PromptSubmission[];
    const beforeCount = list.length;
    const remaining = list.filter(sub => sub.session_id !== sessionId);
    db.getData().prompt_submissions = remaining;
    db.save();
    return beforeCount - remaining.length;
  }
};




