import { memoryDb, initDatabase } from './config/database';
import { v4 as uuidv4 } from 'uuid';

export function seedData() {
  initDatabase();

  console.log('Seeding initial portal data...');

  const data = memoryDb.getData();

  if (data.admins.length > 0) {
    console.log('Database already seeded. Skipping.');
    return;
  }

  const now = new Date().toISOString();

  // 1. Admin
  const adminId = 'adm-001';
  data.admins.push({
    id: adminId,
    name: 'Dr. Sarah Jenkins',
    email: 'admin@college.edu',
    password: 'admin',
    role: 'ADMIN',
    department: 'Computer Science & Engineering',
    created_at: now
  });
  data.admins.push({
    id: 'adm-002',
    name: 'Pranav (Admin)',
    email: 'pranavannur9659@gmail.com',
    password: '9488529035',
    role: 'ADMIN',
    department: 'Computer Science & Engineering',
    created_at: now
  });

  // 2. Students
  const students = [
    {
      id: 'std-001',
      student_id: '7376242AD138',
      name: 'DEEPIKA J',
      email: 'deepikaj.ad24@bitsathy.ac.in',
      password: '7376242AD138',
      department: 'AD',
      year: 3,
      community: 'AGENTIC AI & LLM OPTIMIZATION',
      interest: 'Willing to be a Member',
      skill_level: 'Beginner',
      profile: 'Learning stage',
      suggested_role: 'Research/Learning',
      status: 'ACTIVE',
      created_at: now
    },
    {
      id: 'std-002',
      student_id: '7376251CS145',
      name: 'DEEPIKA V',
      email: 'deepika.cs25@bitsathy.ac.in',
      password: '7376251CS145',
      department: 'CS',
      year: 2,
      community: 'AGENTIC AI & LLM OPTIMIZATION',
      interest: 'Willing to be a Member',
      skill_level: 'Beginner',
      profile: 'Learning stage, No projects, C level 2',
      suggested_role: 'Learning + QA',
      status: 'ACTIVE',
      created_at: now
    },
    {
      id: 'std-003',
      student_id: '7376252AD242',
      name: 'MOHAMED IRFAN R',
      email: 'mohamedirfanr.ad25@bitsathy.ac.in',
      password: '7376252AD242',
      department: 'AD',
      year: 2,
      community: 'AGENTIC AI & LLM OPTIMIZATION',
      interest: 'Willing to be a Member',
      skill_level: 'Beginner',
      profile: 'Learning stage (C:3)',
      suggested_role: 'Learning + Coding',
      status: 'ACTIVE',
      created_at: now
    },
    {
      id: 'std-004',
      student_id: '7376252AD320',
      name: 'SELVA RITHIKA S',
      email: 'selvarithikas.ad25@bitsathy.ac.in',
      password: '7376252AD320',
      department: 'AD',
      year: 2,
      community: 'AGENTIC AI & LLM OPTIMIZATION',
      interest: 'Willing to be a Member',
      skill_level: 'Beginner',
      profile: 'C Level: 2, HTML, CSS',
      suggested_role: 'Frontend Support',
      status: 'ACTIVE',
      created_at: now
    },
    {
      id: 'std-005',
      student_id: '7376252IT236',
      name: 'MAHESAN A',
      email: 'mahesana.it25@bitsathy.ac.in',
      password: '7376252IT236',
      department: 'IT',
      year: 2,
      community: 'AGENTIC AI & LLM OPTIMIZATION',
      interest: 'Willing to be a Member',
      skill_level: 'Strong coding',
      profile: 'Learning stage (C:5, C++:3, Java:3, Python:3, LeetCode:440)',
      suggested_role: 'Technical Lead/Builder',
      status: 'ACTIVE',
      created_at: now
    },
    {
      id: 'std-006',
      student_id: '7376241CS214',
      name: 'JANANI SUBHA S',
      email: 'jananisubhas.cs24@bitsathy.ac.in',
      password: '7376241CS214',
      department: 'CS',
      year: 3,
      community: 'AGENTIC AI & LLM OPTIMIZATION',
      interest: 'Willing to be a Member',
      skill_level: 'Beginner',
      profile: 'Learning stage',
      suggested_role: 'Learning',
      status: 'ACTIVE',
      created_at: now
    },
    {
      id: 'std-007',
      student_id: '7376241CS432',
      name: 'TANUSHREE P',
      email: 'tanushreep.cs24@bitsathy.ac.in',
      password: '7376241CS432',
      department: 'CS',
      year: 3,
      community: 'AGENTIC AI & LLM OPTIMIZATION',
      interest: 'Willing to be a Member',
      skill_level: 'Unspecified',
      profile: 'Operations & Documentation',
      suggested_role: 'Operations/Documentation',
      status: 'ACTIVE',
      created_at: now
    },
    {
      id: 'std-008',
      student_id: '7376242AD143',
      name: 'DHARANISELVAM P',
      email: 'dharaniselvamp.ad24@bitsathy.ac.in',
      password: '7376242AD143',
      department: 'AD',
      year: 3,
      community: 'AGENTIC AI & LLM OPTIMIZATION',
      interest: 'Willing to be a Member',
      skill_level: 'Unspecified',
      profile: 'Research & Documentation',
      suggested_role: 'Research/Documentation',
      status: 'ACTIVE',
      created_at: now
    },
    {
      id: 'std-009',
      student_id: '7376242AD258',
      name: 'PRITHIVIKA R',
      email: 'prithivikar.ad24@bitsathy.ac.in',
      password: '7376242AD258',
      department: 'AD',
      year: 3,
      community: 'AGENTIC AI & LLM OPTIMIZATION',
      interest: 'Willing to be a Member',
      skill_level: 'Unspecified',
      profile: 'Research & Documentation',
      suggested_role: 'Research/Documentation',
      status: 'ACTIVE',
      created_at: now
    },
    {
      id: 'std-010',
      student_id: '7376242AD287',
      name: 'SANJAI V S',
      email: 'sanjaivs.ad24@bitsathy.ac.in',
      password: '7376242AD287',
      department: 'AD',
      year: 3,
      community: 'AGENTIC AI & LLM OPTIMIZATION',
      interest: 'Willing to be a Member',
      skill_level: 'Unspecified',
      profile: 'Operations',
      suggested_role: 'Operations',
      status: 'ACTIVE',
      created_at: now
    },
    {
      id: 'std-011',
      student_id: '7376242AL180',
      name: 'RUDHRAN B',
      email: 'rudhranb.al24@bitsathy.ac.in',
      password: '7376242AL180',
      department: 'AL',
      year: 3,
      community: 'AGENTIC AI & LLM OPTIMIZATION',
      interest: 'Willing to be a Member',
      skill_level: 'Project + coding',
      profile: 'C:3, C++:2, Python:2, HTML/CSS completed, AI project completed, Learning stage',
      suggested_role: 'AI Project Builder',
      status: 'ACTIVE',
      created_at: now
    },
    {
      id: 'std-012',
      student_id: '7376242IT295',
      name: 'SHASVIN D',
      email: 'shasvind.it24@bitsathy.ac.in',
      password: '7376242IT295',
      department: 'IT',
      year: 3,
      community: 'AGENTIC AI & LLM OPTIMIZATION',
      interest: 'Willing to be a Member',
      skill_level: 'Intermediate',
      profile: 'Intermediate, Python Level 3',
      suggested_role: 'Python Builder',
      status: 'ACTIVE',
      created_at: now
    },
    {
      id: 'std-013',
      student_id: '7376251CS214',
      name: 'HASIKA V',
      email: 'hasikav.cs25@bitsathy.ac.in',
      password: '7376251CS214',
      department: 'CS',
      year: 2,
      community: 'AGENTIC AI & LLM OPTIMIZATION',
      interest: 'Willing to be a Member',
      skill_level: 'Beginner',
      profile: 'Learning stage (C level 1)',
      suggested_role: 'Learning + QA',
      status: 'ACTIVE',
      created_at: now
    },
    {
      id: 'std-014',
      student_id: '7376251CS283',
      name: 'MATHI PRIYAN M',
      email: 'mathipriyanm.cs25@bitsathy.ac.in',
      password: '7376251CS283',
      department: 'CS',
      year: 2,
      community: 'AGENTIC AI & LLM OPTIMIZATION',
      interest: 'Willing to be a Member',
      skill_level: 'Unspecified',
      profile: 'Learning stage',
      suggested_role: 'Learning',
      status: 'ACTIVE',
      created_at: now
    },
    {
      id: 'std-015',
      student_id: '7376251CS371',
      name: 'ROHITH S',
      email: 'rohiths.cs25@bitsathy.ac.in',
      password: '7376251CS371',
      department: 'CS',
      year: 2,
      community: 'AGENTIC AI & LLM OPTIMIZATION',
      interest: 'Willing to be a Member',
      skill_level: 'LLM project',
      profile: 'Completed 1 project in LLM (C level 1, HTML/CSS)',
      suggested_role: 'LLM Project Builder',
      status: 'ACTIVE',
      created_at: now
    },
    {
      id: 'std-016',
      student_id: '7376251CS504',
      name: 'ANGESH KARTHIK S',
      email: 'angeshkarthiks.cs24@bitsathy.ac.in',
      password: '7376251CS504',
      department: 'CS',
      year: 3,
      community: 'AGENTIC AI & LLM OPTIMIZATION',
      interest: 'Willing to be a Member',
      skill_level: 'Strong coding',
      profile: 'C:3, Java/C++/Python:2, HTML/CSS, GitHub, LeetCode:155, Learning stage',
      suggested_role: 'Coding/Tech Support',
      status: 'ACTIVE',
      created_at: now
    },
    {
      id: 'std-017',
      student_id: '7376252AD144',
      name: 'DEVAPRASANNA S',
      email: 'devaprasannas.ad25@bitsathy.ac.in',
      password: '7376252AD144',
      department: 'AD',
      year: 2,
      community: 'AGENTIC AI & LLM OPTIMIZATION',
      interest: 'Willing to be a Member',
      skill_level: 'Backend beginner',
      profile: 'C:3, NodeJS, Learning stage',
      suggested_role: 'Backend Builder',
      status: 'ACTIVE',
      created_at: now
    },
    {
      id: 'std-018',
      student_id: '7376252AD221',
      name: 'KRISHNAKUMAR S',
      email: 'krishnakumars.ad25@bitsathy.ac.in',
      password: '7376252AD221',
      department: 'AD',
      year: 2,
      community: 'AGENTIC AI & LLM OPTIMIZATION',
      interest: 'Willing to be a Member',
      skill_level: 'Unspecified',
      profile: 'Learning stage',
      suggested_role: 'Learning',
      status: 'ACTIVE',
      created_at: now
    },
    {
      id: 'std-019',
      student_id: '7376252AL134',
      name: 'HARINDRA S',
      email: 'harindras.al25@bitsathy.ac.in',
      password: '7376252AL134',
      department: 'AL',
      year: 2,
      community: 'AGENTIC AI & LLM OPTIMIZATION',
      interest: 'Willing to be a Member',
      skill_level: 'Beginner',
      profile: 'Learning stage, No projects, C level 3',
      suggested_role: 'Learning',
      status: 'ACTIVE',
      created_at: now
    },
    {
      id: 'std-020',
      student_id: '7376252AL204',
      name: 'SAHITHYA K',
      email: 'sahithyak.al25@bitsathy.ac.in',
      password: '7376252AL204',
      department: 'AL',
      year: 2,
      community: 'AGENTIC AI & LLM OPTIMIZATION',
      interest: 'Willing to be a Member',
      skill_level: 'Beginner',
      profile: 'Learning stage, C:1, HTML/CSS:1, LeetCode:4',
      suggested_role: 'Frontend Support',
      status: 'ACTIVE',
      created_at: now
    },
    {
      id: 'std-021',
      student_id: '7376252IT121',
      name: 'BAVADHARANI S',
      email: 'bavadharanis.it25@bitsathy.ac.in',
      password: '7376252IT121',
      department: 'IT',
      year: 2,
      community: 'AGENTIC AI & LLM OPTIMIZATION',
      interest: 'Willing to be a Member',
      skill_level: 'Project experience',
      profile: 'Learning stage, 2 projects completed, C level 4',
      suggested_role: 'Project Builder',
      status: 'ACTIVE',
      created_at: now
    },
    {
      id: 'std-022',
      student_id: '7376252IT195',
      name: 'JAYASRI C',
      email: 'jayasric.it25@bitsathy.ac.in',
      password: '7376252IT195',
      department: 'IT',
      year: 2,
      community: 'AGENTIC AI & LLM OPTIMIZATION',
      interest: 'Willing to be a Member',
      skill_level: 'Web basics',
      profile: 'Learning stage, Cisco HTML & CSS course completed online',
      suggested_role: 'Frontend Support',
      status: 'ACTIVE',
      created_at: now
    },
    {
      id: 'std-023',
      student_id: '7376252IT293',
      name: 'RAJAMANI S',
      email: 'rajamanis.it25@bitsathy.ac.in',
      password: '7376252IT293',
      department: 'IT',
      year: 2,
      community: 'AGENTIC AI & LLM OPTIMIZATION',
      interest: 'Willing to be a Member',
      skill_level: 'Beginner',
      profile: 'Learning stage',
      suggested_role: 'Learning',
      status: 'ACTIVE',
      created_at: now
    },
    {
      id: 'std-024',
      student_id: '7376252AD289',
      name: 'REVANTH A',
      email: 'revantha.ad25@bitsathy.ac.in',
      password: '7376252AD289',
      department: 'AD',
      year: 2,
      community: 'NATURAL LANGUAGE PROCESSING',
      interest: 'Willing to be a Member',
      skill_level: 'NLP learner',
      profile: 'Learning stage, No projects',
      suggested_role: 'NLP/LLM Learning',
      status: 'ACTIVE',
      created_at: now
    },
    {
      id: 'std-025',
      student_id: '7376252IT280',
      name: 'Student (7376252IT280)',
      email: '7376252it280@college.edu',
      password: '7376252IT280',
      department: 'IT',
      year: 3,
      community: 'Agentic AI & LLM Optimization',
      interest: 'Willing to be a Member',
      skill_level: 'Intermediate',
      profile: 'Learning stage',
      suggested_role: 'AI Systems Engineer',
      status: 'ACTIVE',
      created_at: now
    }
  ];

  data.students.push(...students);

  for (const s of students) {
    data.student_progress.push({
      id: uuidv4(),
      student_id: s.id,
      materials_viewed_count: 3,
      assessments_completed_count: 1,
      avg_score: 85.0,
      attendance_pct: 92.5,
      updated_at: now
    });
  }

  // 3. Study Materials
  const mat1Id = 'mat-001';
  const mat2Id = 'mat-002';
  const mat3Id = 'mat-003';

  data.study_materials.push(
    {
      id: mat1Id,
      title: 'Agentic AI Introduction & Architecture Guidelines',
      description: 'Comprehensive starter guide on ReAct, Planning Agents, and Multi-Agent Orchestration.',
      material_type: 'PDF',
      file_url: '/uploads/Agentic_AI_Introduction.pdf',
      page_count: 15,
      target_type: 'ALL',
      published_date: now,
      created_by: adminId
    },
    {
      id: mat2Id,
      title: 'Transformer Architecture & Attention Mechanisms',
      description: 'Deep dive into Multi-Head Self Attention, Positional Encodings, and Encoder-Decoder models.',
      material_type: 'PDF',
      file_url: '/uploads/Transformer_Architecture.pdf',
      page_count: 24,
      target_type: 'COMMUNITY',
      target_community: 'Agentic AI & LLM Optimization',
      published_date: now,
      created_by: adminId
    },
    {
      id: mat3Id,
      title: 'Prompt Engineering & Structured Outputs Guide',
      description: 'Best practices for Few-Shot prompting, Chain of Thought, and JSON Schema constraints.',
      material_type: 'URL',
      file_url: 'https://learn.promptengineering.org/advanced-guide',
      target_type: 'ALL',
      published_date: now,
      created_by: adminId
    }
  );

  // 4. Questions
  const q1 = 'q-001';
  const q2 = 'q-002';
  const q3 = 'q-003';
  const q4 = 'q-004';
  const q5 = 'q-005';

  data.questions.push(
    {
      id: q1,
      source_pdf_id: mat1Id,
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
      status: 'APPROVED',
      created_at: now
    },
    {
      id: q2,
      source_pdf_id: mat1Id,
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
      status: 'APPROVED',
      created_at: now
    },
    {
      id: q3,
      source_pdf_id: mat2Id,
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
      status: 'APPROVED',
      created_at: now
    },
    {
      id: q4,
      source_pdf_id: mat1Id,
      question_type: 'WRITING',
      question_text: 'Explain the trade-offs between a single centralized orchestrator agent vs. a decentralized multi-agent network for complex software tasks.',
      rubric: 'Centralized: 2 marks for clear single-point control vs complexity. Decentralized: 2 marks for modularity & scalability vs communication overhead. Examples & Clarity: 1 mark.',
      expected_answer: 'A centralized orchestrator maintains global state and plan clarity, but can become a bottleneck or failure point. Decentralized networks distribute specialized tasks to autonomous worker agents, improving modularity but requiring robust inter-agent protocols.',
      marks: 5,
      difficulty: 'Medium',
      topic: 'Multi-Agent Systems',
      status: 'APPROVED',
      created_at: now
    },
    {
      id: q5,
      source_pdf_id: mat3Id,
      question_type: 'WRITING',
      question_text: 'Describe how Chain-of-Thought (CoT) prompting alters model inference and why it improves performance on multi-step reasoning problems.',
      rubric: 'Model compute allocation explanation: 2 marks. Multi-step decomposition: 2 marks. Practical example: 1 mark.',
      expected_answer: 'Chain-of-Thought forces the model to generate intermediate reasoning tokens, effectively extending sequence-level compute budget before outputting the final answer.',
      marks: 5,
      difficulty: 'Easy',
      topic: 'Prompt Engineering',
      status: 'APPROVED',
      created_at: now
    }
  );

  // 5. Question Pools
  const poolId = 'pool-001';
  data.question_pools.push({
    id: poolId,
    name: 'Agentic AI Core Pool',
    description: 'Master pool of interchangeable MCQ and Writing questions on agentic design.',
    created_at: now,
    question_ids: [q1, q2, q3, q4, q5]
  });

  // 6. Assessments
  const ass1Id = 'ass-001';
  const ass2Id = 'ass-002';

  const startTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const endTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  data.assessments.push(
    {
      id: ass1Id,
      title: 'Agentic AI & Prompt Engineering Level 1',
      description: 'First mandatory evaluation covering ReAct pattern, RAG basics, and CoT reasoning.',
      type: 'HYBRID',
      question_selection_mode: 'FIXED',
      target_type: 'ALL',
      duration_minutes: 30,
      start_time: startTime,
      end_time: endTime,
      passing_percentage: 60.0,
      max_marks: 14.0,
      status: 'PUBLISHED',
      created_by: adminId,
      created_at: now,
      question_ids: [q1, q2, q3, q4]
    },
    {
      id: ass2Id,
      title: 'Advanced LLM Architecture & Pool Test',
      description: 'Randomized draw assessment from the Agentic AI Core pool.',
      type: 'HYBRID',
      question_selection_mode: 'RANDOMIZED_POOL',
      pool_id: poolId,
      draw_count: 3,
      target_type: 'COMMUNITY',
      community: 'Agentic AI & LLM Optimization',
      duration_minutes: 45,
      start_time: startTime,
      end_time: endTime,
      passing_percentage: 70.0,
      max_marks: 12.0,
      status: 'PUBLISHED',
      created_by: adminId,
      created_at: now
    }
  );

  // 7. Attendance Session
  const sessId = 'sess-001';
  data.attendance_sessions.push({
    id: sessId,
    community: 'Agentic AI & LLM Optimization',
    department: 'ALL',
    date: new Date().toISOString().split('T')[0],
    code: '8K4P7Q',
    start_time: now,
    expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    created_by: adminId
  });

  data.attendance_records.push({
    id: uuidv4(),
    session_id: sessId,
    student_id: 'std-001',
    marked_at: now,
    status: 'PRESENT'
  });

  // 8. Notifications
  data.notifications.push(
    {
      id: uuidv4(),
      title: 'Welcome to Student Assessment Portal v2',
      message: 'Explore study materials, complete assigned assessments, and ask AI doubts directly!',
      target_type: 'ALL',
      priority: 'IMPORTANT',
      created_at: now
    },
    {
      id: uuidv4(),
      title: 'New Assessment Available: Agentic AI Level 1',
      message: 'The assessment is now active. Please complete it before the deadline.',
      target_type: 'ALL',
      priority: 'NORMAL',
      created_at: now
    }
  );

  // 9. Initial Audit Log
  data.audit_logs.push({
    id: `audit-${Date.now()}`,
    actor_id: adminId,
    actor_role: 'ADMIN',
    action: 'SEED_DATABASE',
    entity_type: 'SYSTEM',
    entity_id: 'portal-db',
    metadata: JSON.stringify({ note: 'Initial seed of student roster and baseline assessments' }),
    timestamp: now
  });

  memoryDb.save();
  console.log('Database seeded successfully!');
}

// Exported for index.ts initialization
