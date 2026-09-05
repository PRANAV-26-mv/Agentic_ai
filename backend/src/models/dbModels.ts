import { db, memoryDb } from '../config/database';
export { memoryDb };
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

export interface Notification {
  id: string;
  title: string;
  message: string;
  target_type: 'ALL' | 'COMMUNITY' | 'DEPARTMENT' | 'SELECTED';
  target_department?: string;
  target_community?: string;
  priority: 'NORMAL' | 'IMPORTANT';
  scheduled_at?: string;
  created_at: string;
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
      list = list.filter(m => {
        if (m.target_type === 'ALL') return true;
        if (m.target_type === 'DEPARTMENT' && m.target_department === student.department) return true;
        if (m.target_type === 'COMMUNITY' && m.target_community === student.community) return true;
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
    const newQ: Question = {
      ...q,
      id: `q-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
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
        const drawCount = assessment.draw_count || Math.min(poolQuestions.length, 10);
        const shuffled = [...poolQuestions].sort(() => 0.5 - Math.random());
        assignedQuestions = shuffled.slice(0, drawCount);
      }
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
        if (ans && ans.selected_option === q.correct_answer) {
          ans.is_correct = true;
          ans.awarded_marks = q.marks;
          mcqScore += q.marks;
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

    const assessment = AssessmentsModel.findById(attempt.assessment_id);
    const maxMarks = assessment?.max_marks || 20;

    attempt.mcq_score = mcqScore;
    attempt.writing_score = writingScore;
    attempt.total_score = mcqScore + writingScore;
    attempt.percentage = Math.min(100, Math.round(((attempt.total_score) / maxMarks) * 100));
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
      if (n.target_type === 'ALL') return true;
      if (n.target_type === 'DEPARTMENT' && n.target_department === student.department) return true;
      if (n.target_type === 'COMMUNITY' && n.target_community === student.community) return true;
      return false;
    });

    return targeted.map(n => ({
      ...n,
      is_read: readSet.has(n.id)
    })).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },
  markRead(notificationId: string, studentId: string) {
    const reads = memoryDb.table('notification_reads');
    if (!reads.some(r => r.notification_id === notificationId && r.student_id === studentId)) {
      reads.push({
        notification_id: notificationId,
        student_id: studentId,
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
