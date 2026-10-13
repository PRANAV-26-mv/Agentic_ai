id-- =========================================================================
-- STUDENT PORTAL COMPLETE MYSQL WORKBENCH IMPORT SCRIPT
-- Generated: 2026-10-12T17:56:51.926Z
-- Compatible with: MySQL 5.7+, MySQL 8.0+, MariaDB 10.3+, MySQL Workbench
-- =========================================================================

CREATE DATABASE IF NOT EXISTS `student_portal` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `student_portal`;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Portal Storage (Complete JSON snapshot used by the Node backend application)
CREATE TABLE IF NOT EXISTS `portal_storage` (
  `key` VARCHAR(64) PRIMARY KEY,
  `data` LONGTEXT NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `portal_storage` (`key`, `data`, `updated_at`)
VALUES ('portal_state', '{"admins":[{"id":"adm-002","name":"Pranav (Super Admin)","email":"pranavannur9659@gmail.com","password":"9488529035","role":"ADMIN","department":"Computer Science & Engineering","created_at":"2026-09-05T14:20:00.000Z","is_super_admin":true},{"email":"yamunaranir.al25@bitsathy.ac.in","name":"YAMUNA RANI R","department":"Artificial Intelligence & Data Science","password":"7376252AL245","role":"ADMIN","id":"adm-1788626901288","created_at":"2026-09-05T16:48:21.288Z"}],"students":[{"id":"std-001","student_id":"7376242AD138","name":"DEEPIKA J","email":"deepikaj.ad24@bitsathy.ac.in","password":"7376242AD138","department":"AD","year":3,"community":"AGENTIC AI & LLM OPTIMIZATION","skill_level":"Beginner","profile":"Learning stage","interest":"Willing to be a Member","suggested_role":"Research/Learning","status":"ACTIVE","created_at":"2026-09-05T09:25:51.581Z"},{"id":"std-002","student_id":"7376251CS145","name":"DEEPIKA V","email":"deepika.cs25@bitsathy.ac.in","password":"7376251CS145","department":"CS","year":2,"community":"AGENTIC AI & LLM OPTIMIZATION","skill_level":"Beginner","profile":"Learning stage, No projects, C level 2","interest":"Willing to be a Member","suggested_role":"Learning + QA","status":"ACTIVE","created_at":"2026-09-05T09:25:51.581Z"},{"id":"std-003","student_id":"7376252AD242","name":"MOHAMED IRFAN R","email":"mohamedirfanr.ad25@bitsathy.ac.in","password":"7376252AD242","department":"AD","year":2,"community":"AGENTIC AI & LLM OPTIMIZATION","skill_level":"Beginner","profile":"Learning stage (C:3)","interest":"Willing to be a Member","suggested_role":"Learning + Coding","status":"ACTIVE","created_at":"2026-09-05T09:25:51.581Z"},{"id":"std-004","student_id":"7376252AD320","name":"SELVA RITHIKA S","email":"selvarithikas.ad25@bitsathy.ac.in","password":"7376252AD320","department":"AD","year":2,"community":"AGENTIC AI & LLM OPTIMIZATION","skill_level":"Beginner","profile":"C Level: 2, HTML, CSS","interest":"Willing to be a Member","suggested_role":"Frontend Support","status":"ACTIVE","created_at":"2026-09-05T09:25:51.581Z"},{"id":"std-005","student_id":"7376252IT236","name":"MAHESAN A","email":"mahesana.it25@bitsathy.ac.in","password":"7376252IT236","department":"IT","year":2,"community":"AGENTIC AI & LLM OPTIMIZATION","skill_level":"Strong coding","profile":"Learning stage (C:5, C++:3, Java:3, Python:3, LeetCode:440)","interest":"Willing to be a Member","suggested_role":"Technical Lead/Builder","status":"ACTIVE","created_at":"2026-09-05T09:25:51.581Z"},{"id":"std-006","student_id":"7376241CS214","name":"JANANI SUBHA S","email":"jananisubhas.cs24@bitsathy.ac.in","password":"7376241CS214","department":"CS","year":3,"community":"AGENTIC AI & LLM OPTIMIZATION","skill_level":"Beginner","profile":"Learning stage","interest":"Willing to be a Member","suggested_role":"Learning","status":"ACTIVE","created_at":"2026-09-05T09:25:51.581Z"},{"id":"std-007","student_id":"7376241CS432","name":"TANUSHREE P","email":"tanushreep.cs24@bitsathy.ac.in","password":"7376241CS432","department":"CS","year":3,"community":"AGENTIC AI & LLM OPTIMIZATION","skill_level":"Unspecified","profile":"Operations & Documentation","interest":"Willing to be a Member","suggested_role":"Operations/Documentation","status":"ACTIVE","created_at":"2026-09-05T09:25:51.581Z"},{"id":"std-008","student_id":"7376242AD143","name":"DHARANISELVAM P","email":"dharaniselvamp.ad24@bitsathy.ac.in","password":"7376242AD143","department":"AD","year":3,"community":"AGENTIC AI & LLM OPTIMIZATION","skill_level":"Unspecified","profile":"Research & Documentation","interest":"Willing to be a Member","suggested_role":"Research/Documentation","status":"ACTIVE","created_at":"2026-09-05T09:25:51.581Z"},{"id":"std-009","student_id":"7376242AD258","name":"PRITHIVIKA R","email":"prithivikar.ad24@bitsathy.ac.in","password":"7376242AD258","department":"AD","year":3,"community":"AGENTIC AI & LLM OPTIMIZATION","skill_level":"Unspecified","profile":"Research & Documentation","interest":"Willing to be a Member","suggested_role":"Research/Documentation","status":"ACTIVE","created_at":"2026-09-05T09:25:51.581Z"},{"id":"std-010","student_id":"7376242AD287","name":"SANJAI V S","email":"sanjaivs.ad24@bitsathy.ac.in","password":"7376242AD287","department":"AD","year":3,"community":"AGENTIC AI & LLM OPTIMIZATION","skill_level":"Unspecified","profile":"Operations","interest":"Willing to be a Member","suggested_role":"Operations","status":"ACTIVE","created_at":"2026-09-05T09:25:51.581Z"},{"id":"std-011","student_id":"7376242AL180","name":"RUDHRAN B","email":"rudhranb.al24@bitsathy.ac.in","password":"7376242AL180","department":"AL","year":3,"community":"AGENTIC AI & LLM OPTIMIZATION","skill_level":"Project + coding","profile":"C:3, C++:2, Python:2, HTML/CSS completed, AI project completed, Learning stage","interest":"Willing to be a Member","suggested_role":"AI Project Builder","status":"ACTIVE","created_at":"2026-09-05T09:25:51.581Z"},{"id":"std-012","student_id":"7376242IT295","name":"SHASVIN D","email":"shasvind.it24@bitsathy.ac.in","password":"7376242IT295","department":"IT","year":3,"community":"AGENTIC AI & LLM OPTIMIZATION","skill_level":"Intermediate","profile":"Intermediate, Python Level 3","interest":"Willing to be a Member","suggested_role":"Python Builder","status":"ACTIVE","created_at":"2026-09-05T09:25:51.581Z"},{"id":"std-013","student_id":"7376251CS214","name":"HASIKA V","email":"hasikav.cs25@bitsathy.ac.in","password":"7376251CS214","department":"CS","year":2,"community":"AGENTIC AI & LLM OPTIMIZATION","skill_level":"Beginner","profile":"Learning stage (C level 1)","interest":"Willing to be a Member","suggested_role":"Learning + QA","status":"ACTIVE","created_at":"2026-09-05T09:25:51.581Z"},{"id":"std-014","student_id":"7376251CS283","name":"MATHI PRIYAN M","email":"mathipriyanm.cs25@bitsathy.ac.in","password":"7376251CS283","department":"CS","year":2,"community":"AGENTIC AI & LLM OPTIMIZATION","skill_level":"Unspecified","profile":"Learning stage","interest":"Willing to be a Member","suggested_role":"Learning","status":"ACTIVE","created_at":"2026-09-05T09:25:51.581Z"},{"id":"std-015","student_id":"7376251CS371","name":"ROHITH S","email":"rohiths.cs25@bitsathy.ac.in","password":"7376251CS371","department":"CS","year":2,"community":"AGENTIC AI & LLM OPTIMIZATION","skill_level":"LLM project","profile":"Completed 1 project in LLM (C level 1, HTML/CSS)","interest":"Willing to be a Member","suggested_role":"LLM Project Builder","status":"ACTIVE","created_at":"2026-09-05T09:25:51.581Z"},{"id":"std-016","student_id":"7376251CS504","name":"ANGESH KARTHIK S","email":"angeshkarthiks.cs24@bitsathy.ac.in","password":"7376251CS504","department":"CS","year":3,"community":"AGENTIC AI & LLM OPTIMIZATION","skill_level":"Strong coding","profile":"C:3, Java/C++/Python:2, HTML/CSS, GitHub, LeetCode:155, Learning stage","interest":"Willing to be a Member","suggested_role":"Coding/Tech Support","status":"ACTIVE","created_at":"2026-09-05T09:25:51.581Z"},{"id":"std-017","student_id":"7376252AD144","name":"DEVAPRASANNA S","email":"devaprasannas.ad25@bitsathy.ac.in","password":"7376252AD144","department":"AD","year":2,"community":"AGENTIC AI & LLM OPTIMIZATION","skill_level":"Backend beginner","profile":"C:3, NodeJS, Learning stage","interest":"Willing to be a Member","suggested_role":"Backend Builder","status":"ACTIVE","created_at":"2026-09-05T09:25:51.581Z"},{"id":"std-018","student_id":"7376252AD221","name":"KRISHNAKUMAR S","email":"krishnakumars.ad25@bitsathy.ac.in","password":"7376252AD221","department":"AD","year":2,"community":"AGENTIC AI & LLM OPTIMIZATION","skill_level":"Unspecified","profile":"Learning stage","interest":"Willing to be a Member","suggested_role":"Learning","status":"ACTIVE","created_at":"2026-09-05T09:25:51.581Z"},{"id":"std-019","student_id":"7376252AL134","name":"HARINDRA S","email":"harindras.al25@bitsathy.ac.in","password":"7376252AL134","department":"AL","year":2,"community":"AGENTIC AI & LLM OPTIMIZATION","skill_level":"Beginner","profile":"Learning stage, No projects, C level 3","interest":"Willing to be a Member","suggested_role":"Learning","status":"ACTIVE","created_at":"2026-09-05T09:25:51.581Z"},{"id":"std-020","student_id":"7376252AL204","name":"SAHITHYA K","email":"sahithyak.al25@bitsathy.ac.in","password":"7376252AL204","department":"AL","year":2,"community":"AGENTIC AI & LLM OPTIMIZATION","skill_level":"Beginner","profile":"Learning stage, C:1, HTML/CSS:1, LeetCode:4","interest":"Willing to be a Member","suggested_role":"Frontend Support","status":"ACTIVE","created_at":"2026-09-05T09:25:51.581Z"},{"id":"std-021","student_id":"7376252IT121","name":"BAVADHARANI S","email":"bavadharanis.it25@bitsathy.ac.in","password":"7376252IT121","department":"IT","year":2,"community":"AGENTIC AI & LLM OPTIMIZATION","skill_level":"Project experience","profile":"Learning stage, 2 projects completed, C level 4","interest":"Willing to be a Member","suggested_role":"Project Builder","status":"ACTIVE","created_at":"2026-09-05T09:25:51.581Z"},{"id":"std-022","student_id":"7376252IT195","name":"JAYASRI C","email":"jayasric.it25@bitsathy.ac.in","password":"7376252IT195","department":"IT","year":2,"community":"AGENTIC AI & LLM OPTIMIZATION","skill_level":"Web basics","profile":"Learning stage, Cisco HTML & CSS course completed online","interest":"Willing to be a Member","suggested_role":"Frontend Support","status":"ACTIVE","created_at":"2026-09-05T09:25:51.581Z"},{"id":"std-023","student_id":"7376252IT293","name":"RAJAMANI S","email":"rajamanis.it25@bitsathy.ac.in","password":"7376252IT293","department":"IT","year":2,"community":"AGENTIC AI & LLM OPTIMIZATION","skill_level":"Beginner","profile":"Learning stage","interest":"Willing to be a Member","suggested_role":"Learning","status":"ACTIVE","created_at":"2026-09-05T09:25:51.581Z"},{"id":"std-024","student_id":"7376252AD289","name":"REVANTH A","email":"revantha.ad25@bitsathy.ac.in","password":"7376252AD289","department":"AD","year":2,"community":"NATURAL LANGUAGE PROCESSING","skill_level":"NLP learner","profile":"Learning stage, No projects","interest":"Willing to be a Member","suggested_role":"NLP/LLM Learning","status":"ACTIVE","created_at":"2026-09-05T09:25:51.581Z"},{"id":"std-025","student_id":"7376252IT280","name":"Student (7376252IT280)","email":"7376252it280@college.edu","password":"7376252IT280","department":"IT","year":3,"community":"Agentic AI & LLM Optimization","skill_level":"Intermediate","profile":"Learning stage","interest":"Willing to be a Member","suggested_role":"AI Systems Engineer","status":"ACTIVE","created_at":"2026-09-05T09:25:51.581Z"}],"assessments":[{"id":"ass-001","title":"Agentic AI & Prompt Engineering Level 1","description":"First mandatory evaluation covering ReAct pattern, RAG basics, and CoT reasoning.","type":"HYBRID","question_selection_mode":"FIXED","target_type":"ALL","duration_minutes":30,"start_time":"2026-09-09T09:07:49.978Z","end_time":"2026-09-17T09:07:49.978Z","passing_percentage":60,"max_marks":14,"status":"PUBLISHED","created_by":"adm-002","created_at":"2026-09-10T09:07:49.977Z","question_ids":["q-001","q-002","q-003","q-004"]},{"id":"ass-002","title":"Advanced LLM Architecture & Pool Test","description":"Randomized draw assessment from the Agentic AI Core pool.","type":"HYBRID","question_selection_mode":"RANDOMIZED_POOL","pool_id":"pool-001","draw_count":3,"target_type":"COMMUNITY","community":"Agentic AI & LLM Optimization","duration_minutes":45,"start_time":"2026-09-09T09:07:49.978Z","end_time":"2026-09-17T09:07:49.978Z","passing_percentage":70,"max_marks":12,"status":"PUBLISHED","created_by":"adm-002","created_at":"2026-09-10T09:07:49.977Z"}],"assessment_assignments":[],"questions":[{"id":"q-001","source_pdf_id":"mat-001","question_type":"MCQ","question_text":"What is the core distinction of a ReAct (Reasoning + Acting) agent compared to a standard prompt pipeline?","option_a":"It executes code natively without external tools","option_b":"It interleaves reasoning step thoughts with tool execution observations in an iterative loop","option_c":"It pre-compiles all decision paths before execution","option_d":"It relies solely on zero-shot memory search","correct_answer":"B","explanation":"ReAct agents iteratively generate reasoning traces (Thought) and actions (Tool invocation), observing tool outputs before deciding the next step.","marks":2,"difficulty":"Medium","topic":"Agentic Workflows","status":"APPROVED","created_at":"2026-09-10T09:07:49.977Z"},{"id":"q-002","source_pdf_id":"mat-001","question_type":"MCQ","question_text":"Which component in a RAG (Retrieval-Augmented Generation) system converts unstructured text into dense semantic vector representations?","option_a":"Tokenizer","option_b":"Embedding Model","option_c":"Cross-Encoder Reranker","option_d":"Decoder Head","correct_answer":"B","explanation":"Embedding models map text chunks into high-dimensional vector spaces where semantic similarity can be computed via cosine distance.","marks":2,"difficulty":"Easy","topic":"RAG Systems","status":"APPROVED","created_at":"2026-09-10T09:07:49.977Z"},{"id":"q-003","source_pdf_id":"mat-002","question_type":"MCQ","question_text":"What is the primary advantage of FlashAttention over standard Multi-Head Attention in modern LLM architectures?","option_a":"It eliminates the need for Positional Embeddings","option_b":"It reduces memory IO complexity from quadratic O(N?) to linear by tiling GPU SRAM operations","option_c":"It converts self-attention into feed-forward layers","option_d":"It increases vocabulary size automatically","correct_answer":"B","explanation":"FlashAttention optimizes GPU memory bandwidth by executing attention matrix computation in SRAM tiles without writing full N x N matrices to HBM.","marks":2,"difficulty":"Hard","topic":"LLM Architectures","status":"APPROVED","created_at":"2026-09-10T09:07:49.977Z"},{"id":"q-004","source_pdf_id":"mat-001","question_type":"WRITING","question_text":"Explain the trade-offs between a single centralized orchestrator agent vs. a decentralized multi-agent network for complex software tasks.","rubric":"Centralized: 2 marks for clear single-point control vs complexity. Decentralized: 2 marks for modularity & scalability vs communication overhead. Examples & Clarity: 1 mark.","expected_answer":"A centralized orchestrator maintains global state and plan clarity, but can become a bottleneck or failure point. Decentralized networks distribute specialized tasks to autonomous worker agents, improving modularity but requiring robust inter-agent protocols.","marks":5,"difficulty":"Medium","topic":"Multi-Agent Systems","status":"APPROVED","created_at":"2026-09-10T09:07:49.977Z"},{"id":"q-005","source_pdf_id":"mat-003","question_type":"WRITING","question_text":"Describe how Chain-of-Thought (CoT) prompting alters model inference and why it improves performance on multi-step reasoning problems.","rubric":"Model compute allocation explanation: 2 marks. Multi-step decomposition: 2 marks. Practical example: 1 mark.","expected_answer":"Chain-of-Thought forces the model to generate intermediate reasoning tokens, effectively extending sequence-level compute budget before outputting the final answer.","marks":5,"difficulty":"Easy","topic":"Prompt Engineering","status":"APPROVED","created_at":"2026-09-10T09:07:49.977Z"}],"question_options":[],"question_pools":[{"id":"pool-001","name":"Agentic AI Core Pool","description":"Master pool of interchangeable MCQ and Writing questions on agentic design.","created_at":"2026-09-10T09:07:49.977Z","question_ids":["q-001","q-002","q-003","q-004","q-005"]}],"question_pool_items":[],"assessment_questions":[],"assessment_attempts":[],"student_answers":[],"study_materials":[{"id":"mat-001","title":"Agentic AI Introduction & Architecture Guidelines","description":"Comprehensive starter guide on ReAct, Planning Agents, and Multi-Agent Orchestration.","material_type":"PDF","file_url":"/uploads/Agentic_AI_Introduction.pdf","page_count":15,"target_type":"ALL","published_date":"2026-09-10T09:07:49.977Z","created_by":"adm-002"},{"id":"mat-002","title":"Transformer Architecture & Attention Mechanisms","description":"Deep dive into Multi-Head Self Attention, Positional Encodings, and Encoder-Decoder models.","material_type":"PDF","file_url":"/uploads/Transformer_Architecture.pdf","page_count":24,"target_type":"COMMUNITY","target_community":"Agentic AI & LLM Optimization","published_date":"2026-09-10T09:07:49.977Z","created_by":"adm-002"},{"id":"mat-003","title":"Prompt Engineering & Structured Outputs Guide","description":"Best practices for Few-Shot prompting, Chain of Thought, and JSON Schema constraints.","material_type":"URL","file_url":"https://learn.promptengineering.org/advanced-guide","target_type":"ALL","published_date":"2026-09-10T09:07:49.977Z","created_by":"adm-002"},{"title":"Advanced Agentic Workflows & Multi-Agent Systems","description":"Comprehensive guide covering tool use, memory architectures, and delegation patterns.","material_type":"PDF","file_url":"/uploads/1789325343315-77518515.pdf","page_count":7,"target_type":"COMMUNITY","target_community":"Agentic AI & LLM Optimization","created_by":"adm-002","id":"mat-1789325343319","published_date":"2026-09-13T18:49:03.319Z"},{"title":"Official LangGraph & AutoGen Documentation","description":"Official developer guides and orchestration frameworks.","material_type":"URL","file_url":"https://langchain-ai.github.io/langgraph/","target_type":"ALL","created_by":"adm-002","id":"mat-1789325343336","published_date":"2026-09-13T18:49:03.336Z"},{"id":"mat-url-001","title":"Hugging Face Hub & Transformers Documentation","description":"Explore open-source models, pipelines, fine-tuning datasets, tokenizers, and active community spaces.","material_type":"URL","file_url":"https://huggingface.co/docs","target_type":"ALL","published_date":"2026-10-09T19:09:44.795Z","created_by":"adm-002"},{"id":"mat-url-002","title":"DeepLearning.AI Agentic Systems & Short Courses","description":"Comprehensive video tutorials and code labs on ReAct, Function Calling, and Multi-Agent Orchestration.","material_type":"URL","file_url":"https://www.deeplearning.ai/short-courses/","target_type":"COMMUNITY","target_community":"Agentic AI & LLM Optimization","published_date":"2026-10-09T19:09:44.795Z","created_by":"adm-002"},{"id":"mat-url-003","title":"Anthropic Claude Documentation & Workbench","description":"Official developer guidance on prompt evaluation, structured JSON outputs, and agentic workflows.","material_type":"URL","file_url":"https://docs.anthropic.com/","target_type":"ALL","published_date":"2026-10-09T19:09:44.795Z","created_by":"adm-002"},{"id":"mat-url-004","title":"Fast.ai Practical Deep Learning for Coders","description":"Hands-on top-down curriculum covering PyTorch fundamentals, computer vision, NLP, and model training.","material_type":"URL","file_url":"https://course.fast.ai/","target_type":"ALL","published_date":"2026-10-09T19:09:44.795Z","created_by":"adm-002"},{"id":"mat-url-005","title":"OpenAI Developer Platform & Function Calling Guide","description":"Production guides for tool calling, assistants API, structured reasoning, and multi-agent systems.","material_type":"URL","file_url":"https://platform.openai.com/docs/guides/function-calling","target_type":"COMMUNITY","target_community":"Agentic AI & LLM Optimization","published_date":"2026-10-09T19:09:44.795Z","created_by":"adm-002"}],"attendance_sessions":[{"id":"sess-001","community":"Agentic AI & LLM Optimization","department":"ALL","date":"2026-09-03","code":"8K4P7Q","start_time":"2026-09-03T09:58:32.444Z","expires_at":"2026-09-03T11:58:32.447Z","created_by":"adm-001"},{"community":"Agentic AI & LLM Optimization","department":"ALL","date":"2026-09-03","code":"83BTVC","expires_at":"2026-09-03T11:15:34.173Z","created_by":"adm-001","id":"sess-1788430534174","start_time":"2026-09-03T10:15:34.174Z"},{"community":"Agentic AI & LLM Optimization","department":"ALL","date":"2026-09-03","code":"F2GF44","expires_at":"2026-09-03T10:26:24.250Z","created_by":"adm-001","id":"sess-1788430884250","start_time":"2026-09-03T10:21:24.250Z"}],"attendance_records":[{"id":"76e419cd-db90-4685-b0b5-a468df4759e1","session_id":"sess-001","student_id":"std-001","marked_at":"2026-09-03T09:58:32.444Z","status":"PRESENT"},{"id":"attrec-1788430581456","session_id":"sess-001","student_id":"std-002","marked_at":"2026-09-03T10:16:21.455Z","status":"PRESENT"}],"notifications":[{"id":"89023de5-b5ce-4a98-b5cf-664944dd8fe3","title":"Welcome to Student Assessment Portal v2","message":"Explore study materials, complete assigned assessments, and ask AI doubts directly!","target_type":"ALL","priority":"IMPORTANT","created_at":"2026-09-10T09:07:49.977Z"},{"id":"74ab6ca7-0b48-485a-a69d-84431fdf8823","title":"New Assessment Available: Agentic AI Level 1","message":"The assessment is now active. Please complete it before the deadline.","target_type":"ALL","priority":"NORMAL","created_at":"2026-09-10T09:07:49.977Z"}],"notification_reads":[],"tab_switch_events":[],"student_progress":[{"id":"prog-001","student_id":"std-001","materials_viewed_count":0,"assessments_completed_count":0,"avg_score":0,"attendance_pct":100,"updated_at":"2026-09-05T10:24:27.589Z"},{"id":"prog-002","student_id":"std-002","materials_viewed_count":0,"assessments_completed_count":0,"avg_score":0,"attendance_pct":100,"updated_at":"2026-09-05T10:24:27.589Z"},{"id":"prog-003","student_id":"std-003","materials_viewed_count":0,"assessments_completed_count":0,"avg_score":0,"attendance_pct":100,"updated_at":"2026-09-05T10:24:27.589Z"},{"id":"prog-004","student_id":"std-004","materials_viewed_count":0,"assessments_completed_count":0,"avg_score":0,"attendance_pct":100,"updated_at":"2026-09-05T10:24:27.589Z"},{"id":"prog-005","student_id":"std-005","materials_viewed_count":0,"assessments_completed_count":0,"avg_score":0,"attendance_pct":100,"updated_at":"2026-09-05T10:24:27.589Z"},{"id":"prog-006","student_id":"std-006","materials_viewed_count":0,"assessments_completed_count":0,"avg_score":0,"attendance_pct":100,"updated_at":"2026-09-05T10:24:27.589Z"},{"id":"prog-007","student_id":"std-007","materials_viewed_count":0,"assessments_completed_count":0,"avg_score":0,"attendance_pct":100,"updated_at":"2026-09-05T10:24:27.589Z"},{"id":"prog-008","student_id":"std-008","materials_viewed_count":0,"assessments_completed_count":0,"avg_score":0,"attendance_pct":100,"updated_at":"2026-09-05T10:24:27.589Z"},{"id":"prog-009","student_id":"std-009","materials_viewed_count":0,"assessments_completed_count":0,"avg_score":0,"attendance_pct":100,"updated_at":"2026-09-05T10:24:27.589Z"},{"id":"prog-010","student_id":"std-010","materials_viewed_count":0,"assessments_completed_count":0,"avg_score":0,"attendance_pct":100,"updated_at":"2026-09-05T10:24:27.589Z"},{"id":"prog-011","student_id":"std-011","materials_viewed_count":0,"assessments_completed_count":0,"avg_score":0,"attendance_pct":100,"updated_at":"2026-09-05T10:24:27.589Z"},{"id":"prog-012","student_id":"std-012","materials_viewed_count":0,"assessments_completed_count":0,"avg_score":0,"attendance_pct":100,"updated_at":"2026-09-05T10:24:27.589Z"},{"id":"prog-013","student_id":"std-013","materials_viewed_count":0,"assessments_completed_count":0,"avg_score":0,"attendance_pct":100,"updated_at":"2026-09-05T10:24:27.589Z"},{"id":"prog-014","student_id":"std-014","materials_viewed_count":0,"assessments_completed_count":0,"avg_score":0,"attendance_pct":100,"updated_at":"2026-09-05T10:24:27.589Z"},{"id":"prog-015","student_id":"std-015","materials_viewed_count":0,"assessments_completed_count":0,"avg_score":0,"attendance_pct":100,"updated_at":"2026-09-05T10:24:27.589Z"},{"id":"prog-016","student_id":"std-016","materials_viewed_count":0,"assessments_completed_count":0,"avg_score":0,"attendance_pct":100,"updated_at":"2026-09-05T10:24:27.589Z"},{"id":"prog-017","student_id":"std-017","materials_viewed_count":0,"assessments_completed_count":0,"avg_score":0,"attendance_pct":100,"updated_at":"2026-09-05T10:24:27.589Z"},{"id":"prog-018","student_id":"std-018","materials_viewed_count":0,"assessments_completed_count":0,"avg_score":0,"attendance_pct":100,"updated_at":"2026-09-05T10:24:27.589Z"},{"id":"prog-019","student_id":"std-019","materials_viewed_count":0,"assessments_completed_count":0,"avg_score":0,"attendance_pct":100,"updated_at":"2026-09-05T10:24:27.589Z"},{"id":"prog-020","student_id":"std-020","materials_viewed_count":0,"assessments_completed_count":0,"avg_score":0,"attendance_pct":100,"updated_at":"2026-09-05T10:24:27.589Z"},{"id":"prog-021","student_id":"std-021","materials_viewed_count":0,"assessments_completed_count":0,"avg_score":0,"attendance_pct":100,"updated_at":"2026-09-05T10:24:27.589Z"},{"id":"prog-022","student_id":"std-022","materials_viewed_count":0,"assessments_completed_count":0,"avg_score":0,"attendance_pct":100,"updated_at":"2026-09-05T10:24:27.589Z"},{"id":"prog-023","student_id":"std-023","materials_viewed_count":0,"assessments_completed_count":0,"avg_score":0,"attendance_pct":100,"updated_at":"2026-09-05T10:24:27.589Z"},{"id":"prog-024","student_id":"std-024","materials_viewed_count":0,"assessments_completed_count":0,"avg_score":0,"attendance_pct":100,"updated_at":"2026-09-05T10:24:27.589Z"},{"id":"prog-025","student_id":"std-025","materials_viewed_count":0,"assessments_completed_count":0,"avg_score":0,"attendance_pct":100,"updated_at":"2026-09-05T10:24:27.589Z"}],"audit_logs":[{"id":"audit-1791734196793-148","actor_id":"adm-002","actor_role":"ADMIN","action":"UPDATE_GD_CAPACITY","entity_type":"GD_SESSION","entity_id":"gd-demo-101","metadata":"{\\"max_participants\\":10,\\"speaker_duration_limit_seconds\\":120}","timestamp":"2026-10-11T15:56:36.793Z"},{"id":"audit-1791734196783-46","actor_id":"adm-002","actor_role":"ADMIN","action":"LOGIN","entity_type":"USER","entity_id":"adm-002","timestamp":"2026-10-11T15:56:36.783Z"},{"id":"audit-1791734185321-21","actor_id":"adm-002","actor_role":"ADMIN","action":"UPDATE_GD_CAPACITY","entity_type":"GD_SESSION","entity_id":"gd-demo-101","metadata":"{\\"max_participants\\":25,\\"speaker_duration_limit_seconds\\":180}","timestamp":"2026-10-11T15:56:25.321Z"},{"id":"audit-1791734185307-597","actor_id":"adm-002","actor_role":"ADMIN","action":"LOGIN","entity_type":"USER","entity_id":"adm-002","timestamp":"2026-10-11T15:56:25.307Z"},{"id":"audit-1791733129965-548","actor_id":"adm-002","actor_role":"ADMIN","action":"LOGIN","entity_type":"USER","entity_id":"adm-002","timestamp":"2026-10-11T15:38:49.965Z"},{"id":"audit-1791733121702-357","actor_id":"std-003","actor_role":"STUDENT","action":"LOGIN","entity_type":"USER","entity_id":"std-003","timestamp":"2026-10-11T15:38:41.702Z"},{"id":"audit-1791733121683-530","actor_id":"std-002","actor_role":"STUDENT","action":"LOGIN","entity_type":"USER","entity_id":"std-002","timestamp":"2026-10-11T15:38:41.683Z"},{"id":"audit-1791733119563-658","actor_id":"std-001","actor_role":"STUDENT","action":"LOGIN","entity_type":"USER","entity_id":"std-001","timestamp":"2026-10-11T15:38:39.563Z"},{"id":"audit-1791733119528-481","actor_id":"adm-002","actor_role":"ADMIN","action":"LOGIN","entity_type":"USER","entity_id":"adm-002","timestamp":"2026-10-11T15:38:39.528Z"},{"id":"audit-1791732951681-576","actor_id":"std-003","actor_role":"STUDENT","action":"LOGIN","entity_type":"USER","entity_id":"std-003","timestamp":"2026-10-11T15:35:51.681Z"},{"id":"audit-1791732951671-77","actor_id":"std-002","actor_role":"STUDENT","action":"LOGIN","entity_type":"USER","entity_id":"std-002","timestamp":"2026-10-11T15:35:51.671Z"},{"id":"audit-1791732949628-92","actor_id":"std-001","actor_role":"STUDENT","action":"LOGIN","entity_type":"USER","entity_id":"std-001","timestamp":"2026-10-11T15:35:49.628Z"},{"id":"audit-1791732949622-692","actor_id":"adm-002","actor_role":"ADMIN","action":"LOGIN","entity_type":"USER","entity_id":"adm-002","timestamp":"2026-10-11T15:35:49.622Z"},{"id":"audit-1791732855410-542","actor_id":"std-001","actor_role":"STUDENT","action":"LOGIN","entity_type":"USER","entity_id":"std-001","timestamp":"2026-10-11T15:34:15.410Z"},{"id":"audit-1791732855404-565","actor_id":"adm-002","actor_role":"ADMIN","action":"LOGIN","entity_type":"USER","entity_id":"adm-002","timestamp":"2026-10-11T15:34:15.404Z"},{"id":"audit-1791573860281-514","actor_id":"std-001","actor_role":"STUDENT","action":"LOGIN","entity_type":"USER","entity_id":"std-001","timestamp":"2026-10-09T19:24:20.281Z"},{"id":"audit-1791573702492-195","actor_id":"std-001","actor_role":"STUDENT","action":"LOGIN","entity_type":"USER","entity_id":"std-001","timestamp":"2026-10-09T19:21:42.492Z"},{"id":"audit-1791573609677-943","actor_id":"std-001","actor_role":"STUDENT","action":"LOGIN","entity_type":"USER","entity_id":"std-001","timestamp":"2026-10-09T19:20:09.677Z"},{"id":"audit-1791573534029-961","actor_id":"std-001","actor_role":"STUDENT","action":"LOGIN","entity_type":"USER","entity_id":"std-001","timestamp":"2026-10-09T19:18:54.029Z"},{"id":"audit-1791573484333-636","actor_id":"adm-002","actor_role":"ADMIN","action":"LOGIN","entity_type":"USER","entity_id":"adm-002","timestamp":"2026-10-09T19:18:04.333Z"},{"id":"audit-1791571812093-409","actor_id":"adm-002","actor_role":"ADMIN","action":"LOGIN","entity_type":"USER","entity_id":"adm-002","timestamp":"2026-10-09T18:50:12.093Z"},{"id":"audit-1789326302286-464","actor_id":"std-001","actor_role":"STUDENT","action":"LOGIN","entity_type":"USER","entity_id":"std-001","timestamp":"2026-09-13T19:05:02.286Z"},{"id":"audit-1789326136532-488","actor_id":"std-001","actor_role":"STUDENT","action":"LOGIN","entity_type":"USER","entity_id":"std-001","timestamp":"2026-09-13T19:02:16.532Z"},{"id":"audit-1789326136527-28","actor_id":"adm-002","actor_role":"ADMIN","action":"CREATE_QUIZ_SESSION","entity_type":"QUIZ_SESSION","entity_id":"qs-1789326136526","metadata":"{\\"title\\":\\"AI Agent Architecture & Reasoning Sprint\\",\\"pin\\":\\"882201\\"}","timestamp":"2026-09-13T19:02:16.527Z"},{"id":"audit-1789326136513-863","actor_id":"adm-002","actor_role":"ADMIN","action":"LOGIN","entity_type":"USER","entity_id":"adm-002","timestamp":"2026-09-13T19:02:16.513Z"},{"id":"audit-1789325376448-583","actor_id":"adm-002","actor_role":"ADMIN","action":"LOGIN","entity_type":"USER","entity_id":"adm-002","timestamp":"2026-09-13T18:49:36.448Z"},{"id":"audit-1789325343340-714","actor_id":"adm-002","actor_role":"ADMIN","action":"CREATE_MATERIAL","entity_type":"MATERIAL","entity_id":"mat-1789325343336","metadata":"{\\"title\\":\\"Official LangGraph & AutoGen Documentation\\"}","timestamp":"2026-09-13T18:49:03.340Z"},{"id":"audit-1789325343321-141","actor_id":"adm-002","actor_role":"ADMIN","action":"CREATE_MATERIAL","entity_type":"MATERIAL","entity_id":"mat-1789325343319","metadata":"{\\"title\\":\\"Advanced Agentic Workflows & Multi-Agent Systems\\"}","timestamp":"2026-09-13T18:49:03.321Z"},{"id":"audit-1789325343275-864","actor_id":"adm-002","actor_role":"ADMIN","action":"LOGIN","entity_type":"USER","entity_id":"adm-002","timestamp":"2026-09-13T18:49:03.275Z"},{"id":"audit-1789325182349-453","actor_id":"adm-002","actor_role":"ADMIN","action":"LOGIN","entity_type":"USER","entity_id":"adm-002","timestamp":"2026-09-13T18:46:22.349Z"},{"id":"audit-1789325178204-258","actor_id":"adm-002","actor_role":"ADMIN","action":"CREATE_MATERIAL","entity_type":"MATERIAL","entity_id":"mat-1789325178203","metadata":"{\\"title\\":\\"Test PDF Upload\\"}","timestamp":"2026-09-13T18:46:18.204Z"},{"id":"audit-1789325178185-297","actor_id":"adm-002","actor_role":"ADMIN","action":"LOGIN","entity_type":"USER","entity_id":"adm-002","timestamp":"2026-09-13T18:46:18.185Z"},{"id":"audit-1789034265075-108","actor_id":"adm-002","actor_role":"ADMIN","action":"DELETE_STUDENT","entity_type":"STUDENT","entity_id":"std-1789034264986-869","metadata":"{\\"name\\":\\"Test Deletable\\",\\"email\\":\\"deletable@bitsathy.ac.in\\",\\"student_id\\":\\"7376TEST999\\"}","timestamp":"2026-09-10T09:57:45.075Z"},{"id":"audit-1789034264991-387","actor_id":"adm-002","actor_role":"ADMIN","action":"CREATE_STUDENT","entity_type":"STUDENT","entity_id":"std-1789034264986-869","metadata":"{\\"name\\":\\"Test Deletable\\"}","timestamp":"2026-09-10T09:57:44.991Z"},{"id":"audit-1789031327268-896","actor_id":"adm-002","actor_role":"ADMIN","action":"RESTORE_DATABASE","entity_type":"SYSTEM","entity_id":"DATABASE","metadata":"{\\"timestamp\\":\\"2026-09-10T09:08:47.268Z\\"}","timestamp":"2026-09-10T09:08:47.268Z"},{"id":"audit-1789031319961-200","actor_id":"adm-002","actor_role":"ADMIN","action":"RESTORE_DATABASE","entity_type":"SYSTEM","entity_id":"DATABASE","metadata":"{\\"timestamp\\":\\"2026-09-10T09:08:39.961Z\\"}","timestamp":"2026-09-10T09:08:39.961Z"},{"id":"audit-1789031296594-443","actor_id":"adm-002","actor_role":"ADMIN","action":"LOGIN","entity_type":"USER","entity_id":"adm-002","timestamp":"2026-09-10T09:08:16.594Z"},{"id":"audit-1788676594977-763","actor_id":"adm-002","actor_role":"ADMIN","action":"LOGIN","entity_type":"USER","entity_id":"adm-002","timestamp":"2026-09-06T06:36:34.977Z"},{"id":"audit-1788631239781-372","actor_id":"std-001","actor_role":"STUDENT","action":"LOGIN","entity_type":"USER","entity_id":"std-001","timestamp":"2026-09-05T18:00:39.781Z"},{"id":"audit-1788631236618-751","actor_id":"std-001","actor_role":"STUDENT","action":"LOGIN","entity_type":"USER","entity_id":"std-001","timestamp":"2026-09-05T18:00:36.618Z"},{"id":"audit-1788631200026-177","actor_id":"adm-002","actor_role":"ADMIN","action":"LOGIN","entity_type":"USER","entity_id":"adm-002","timestamp":"2026-09-05T18:00:00.026Z"},{"id":"audit-1788631195637-335","actor_id":"adm-002","actor_role":"ADMIN","action":"LOGIN","entity_type":"USER","entity_id":"adm-002","timestamp":"2026-09-05T17:59:55.637Z"},{"id":"audit-1788628054063-42","actor_id":"adm-002","actor_role":"ADMIN","action":"LOGIN","entity_type":"USER","entity_id":"adm-002","timestamp":"2026-09-05T17:07:34.063Z"},{"id":"audit-1788626953698-222","actor_id":"adm-1788626901288","actor_role":"ADMIN","action":"LOGIN","entity_type":"USER","entity_id":"adm-1788626901288","timestamp":"2026-09-05T16:49:13.698Z"},{"id":"audit-1788626901290-999","actor_id":"adm-002","actor_role":"ADMIN","action":"CREATE_ADMIN","entity_type":"ADMIN_USER","entity_id":"adm-1788626901288","metadata":"{\\"email\\":\\"yamunaranir.al25@bitsathy.ac.in\\",\\"name\\":\\"YAMUNA RANI R\\"}","timestamp":"2026-09-05T16:48:21.290Z"},{"id":"audit-1788626838852-291","actor_id":"adm-002","actor_role":"ADMIN","action":"DELETE_ADMIN","entity_type":"ADMIN_USER","entity_id":"adm-001","metadata":"{\\"email\\":\\"admin@college.edu\\"}","timestamp":"2026-09-05T16:47:18.852Z"},{"id":"audit-1788626820101-323","actor_id":"adm-002","actor_role":"ADMIN","action":"LOGIN","entity_type":"USER","entity_id":"adm-002","timestamp":"2026-09-05T16:47:00.101Z"},{"id":"audit-1788604731023-825","actor_id":"adm-002","actor_role":"ADMIN","action":"DELETE_MATERIAL","entity_type":"MATERIAL","entity_id":"mat-003","timestamp":"2026-09-05T10:38:51.023Z"},{"id":"audit-1788604726293-302","actor_id":"adm-002","actor_role":"ADMIN","action":"DELETE_MATERIAL","entity_type":"MATERIAL","entity_id":"mat-002","timestamp":"2026-09-05T10:38:46.293Z"},{"id":"audit-1788604723589-883","actor_id":"adm-002","actor_role":"ADMIN","action":"DELETE_MATERIAL","entity_type":"MATERIAL","entity_id":"mat-001","timestamp":"2026-09-05T10:38:43.589Z"},{"id":"audit-1788604706431-82","actor_id":"adm-002","actor_role":"ADMIN","action":"DELETE_QUESTION_POOL","entity_type":"QUESTION_POOL","entity_id":"pool-1788601517672","timestamp":"2026-09-05T10:38:26.431Z"},{"id":"audit-1788604700714-289","actor_id":"adm-002","actor_role":"ADMIN","action":"DELETE_ALL_QUESTIONS","entity_type":"QUESTION","timestamp":"2026-09-05T10:38:20.715Z"},{"id":"audit-1788604507742-947","actor_id":"adm-002","actor_role":"ADMIN","action":"DELETE_NOTIFICATION","entity_type":"NOTIFICATION","entity_id":"73d4f482-2a11-4328-abf2-74c3920857bd","metadata":"{\\"title\\":\\"New Assessment Available: Agentic AI Level 1\\"}","timestamp":"2026-09-05T10:35:07.742Z"},{"id":"audit-1788604504628-71","actor_id":"adm-002","actor_role":"ADMIN","action":"DELETE_NOTIFICATION","entity_type":"NOTIFICATION","entity_id":"6ba0575b-0188-498d-af85-68b98b56fe0c","metadata":"{\\"title\\":\\"Welcome to Student Assessment Portal v2\\"}","timestamp":"2026-09-05T10:35:04.628Z"},{"id":"audit-1788604501736-546","actor_id":"adm-002","actor_role":"ADMIN","action":"DELETE_NOTIFICATION","entity_type":"NOTIFICATION","entity_id":"notif-1788430527373","metadata":"{\\"title\\":\\"knkmnmm\\"}","timestamp":"2026-09-05T10:35:01.737Z"},{"id":"audit-1788604041512-592","actor_id":"std-020","actor_role":"STUDENT","action":"LOGIN","entity_type":"USER","entity_id":"std-020","timestamp":"2026-09-05T10:27:21.512Z"},{"id":"audit-1788604018689-834","actor_id":"adm-002","actor_role":"ADMIN","action":"DELETE_ASSESSMENT","entity_type":"ASSESSMENT","entity_id":"ass-1788601618038","timestamp":"2026-09-05T10:26:58.689Z"}],"doubt_conversations":[{"id":"conv-1788604055138","student_id":"std-020","topic":"General Study Material Query","created_at":"2026-09-05T10:27:35.138Z"}],"doubt_messages":[],"quiz_sessions":[{"title":"AI Agent Architecture & Reasoning Sprint","description":"Synchronized live quiz. Answer accurately and quickly for top leaderboard ranking.","pin":"882201","question_ids":["q-001","q-002","q-003"],"target_type":"ALL","duration_minutes":15,"start_time":"2026-09-13T19:02:16.525Z","end_time":"2026-09-14T19:02:16.525Z","status":"ACTIVE","created_by":"adm-002","id":"qs-1789326136526","created_at":"2026-09-13T19:02:16.526Z"}],"quiz_session_participants":[{"id":"qsp-1789326136539-436","session_id":"qs-1789326136526","student_id":"std-001","student_name":"DEEPIKA J","student_reg":"7376242AD138","student_department":"AD","student_community":"AGENTIC AI & LLM OPTIMIZATION","joined_at":"2026-09-13T19:02:16.539Z","status":"SUBMITTED","started_at":"2026-09-13T19:02:16.544Z","submitted_at":"2026-09-13T19:02:16.553Z","score":2,"max_score":6,"percentage":33,"answers_json":"{\\"q-001\\":\\"A\\",\\"q-002\\":\\"B\\",\\"q-003\\":\\"A\\"}","time_taken_seconds":1}],"restricted_emails":[],"email_logs":[],"certificate_settings":[],"meetings":[{"id":"meet-1791570854126-ai001","code":"abc-defg-hij","title":"Agentic AI & Neural Systems Workshop (Live Meet)","description":"Interactive live video & audio discussion, Q&A on neural architectures, and model evaluations.","host_id":"adm-002","host_name":"Pranav (Super Admin)","host_email":"pranavannur9659@gmail.com","meeting_type":"VIDEO_VOICE","audience_type":"ALL_STUDENTS","status":"ACTIVE","scheduled_start_time":"2026-10-09T18:34:14.126Z","actual_start_time":"2026-10-09T18:34:14.126Z","allow_screen_share":true,"allow_student_chat":true,"mute_on_entry":false,"created_at":"2026-10-09T18:34:14.126Z","updated_at":"2026-10-09T18:34:14.126Z","external_link":"https://meet.google.com/abc-defg-hij"}],"meeting_participants":[],"meeting_settings":[{"id":"global-meeting-settings","is_enabled":true,"allow_all_admins":true,"permitted_admin_ids":[],"allowed_audience_types":["ALL_STUDENTS","SPECIFIC_STUDENTS","ADMINS_ONLY","ALL"],"max_participants":100,"updated_at":"2026-10-09T18:34:14.126Z"}],"gd_sessions":[{"id":"gd-demo-101","title":"Campus Cohort GD: Autonomous AI Systems in Industry","topic":"Will autonomous multi-agent AI ecosystems transform software engineering or create critical security bottlenecks?","description":"Turn-based 10-candidate discussion. Each speaker takes the floor with live timer. Cohort peers award marks (1-10) on discussion questions and speaking duration is recorded.","pin":"789123","max_participants":10,"target_type":"ALL","duration_minutes":25,"status":"ACTIVE","created_by":"adm-002","created_at":"2026-10-11T12:00:00.000Z","is_results_published":false,"active_speaker_id":null,"speaker_started_at":null,"current_speaker_index":0,"session_stage":"WAITING","speaker_order":["std-001","std-002","std-003","std-004","std-005","std-006","std-007","std-008","std-009","std-010"],"questions":[{"id":"gdq-1","question_text":"Opening Stance & Problem Articulation: Clarity and impact in introducing the core issue","order":1},{"id":"gdq-2","question_text":"Subject Knowledge & Technical Depth: Evidence-based persuasive points on AI capabilities","order":2},{"id":"gdq-3","question_text":"Listening & Constructive Rebuttals: Courteous and logical counter-perspectives","order":3},{"id":"gdq-4","question_text":"Team Collaboration & Synthesis: Concluding consensus, group leadership, and teamwork","order":4}],"speaker_duration_limit_seconds":120}],"gd_participants":[{"id":"gdp-1","session_id":"gd-demo-101","student_id":"std-001","student_name":"DEEPIKA J","student_reg":"7376242AD138","student_department":"AD","student_community":"AGENTIC AI & LLM OPTIMIZATION","joined_at":"2026-10-11T12:01:00.000Z","status":"JOINED","speaking_order":1,"speaking_status":"WAITING","speaking_time_seconds":0,"rank":1,"average_rank":1,"total_points":0,"average_score_out_of_10":null,"total_marks_received":null,"question_ranks":{"gdq-1":{"average_rank":5,"rank_position":1,"total_points":0,"votes_count":0,"average_score_out_of_10":8.75},"gdq-2":{"average_rank":5,"rank_position":1,"total_points":0,"votes_count":0,"average_score_out_of_10":8.75},"gdq-3":{"average_rank":5,"rank_position":1,"total_points":0,"votes_count":0,"average_score_out_of_10":8.75},"gdq-4":{"average_rank":5,"rank_position":1,"total_points":0,"votes_count":0,"average_score_out_of_10":8.75}},"ratings_count":0},{"id":"gdp-2","session_id":"gd-demo-101","student_id":"std-002","student_name":"DEEPIKA V","student_reg":"7376251CS145","student_department":"CS","student_community":"AGENTIC AI & LLM OPTIMIZATION","joined_at":"2026-10-11T12:01:05.000Z","status":"JOINED","speaking_order":2,"speaking_status":"WAITING","speaking_time_seconds":0,"rank":2,"average_rank":2,"total_points":0,"average_score_out_of_10":null,"total_marks_received":null,"question_ranks":{"gdq-1":{"average_rank":5,"rank_position":2,"total_points":0,"votes_count":0,"average_score_out_of_10":0},"gdq-2":{"average_rank":5,"rank_position":2,"total_points":0,"votes_count":0,"average_score_out_of_10":0},"gdq-3":{"average_rank":5,"rank_position":2,"total_points":0,"votes_count":0,"average_score_out_of_10":0},"gdq-4":{"average_rank":5,"rank_position":2,"total_points":0,"votes_count":0,"average_score_out_of_10":0}},"ratings_count":0},{"id":"gdp-3","session_id":"gd-demo-101","student_id":"std-003","student_name":"MOHAMED IRFAN R","student_reg":"7376252AD242","student_department":"AD","student_community":"AGENTIC AI & LLM OPTIMIZATION","joined_at":"2026-10-11T12:01:10.000Z","status":"JOINED","speaking_order":3,"speaking_status":"WAITING","speaking_time_seconds":0,"rank":3,"average_rank":3,"total_points":0,"average_score_out_of_10":null,"total_marks_received":null,"question_ranks":{"gdq-1":{"average_rank":5,"rank_position":3,"total_points":0,"votes_count":0,"average_score_out_of_10":0},"gdq-2":{"average_rank":5,"rank_position":3,"total_points":0,"votes_count":0,"average_score_out_of_10":0},"gdq-3":{"average_rank":5,"rank_position":3,"total_points":0,"votes_count":0,"average_score_out_of_10":0},"gdq-4":{"average_rank":5,"rank_position":3,"total_points":0,"votes_count":0,"average_score_out_of_10":0}},"ratings_count":0},{"id":"gdp-4","session_id":"gd-demo-101","student_id":"std-004","student_name":"SELVA RITHIKA S","student_reg":"7376252AD320","student_department":"AD","student_community":"AGENTIC AI & LLM OPTIMIZATION","joined_at":"2026-10-11T12:01:15.000Z","status":"JOINED","speaking_order":4,"speaking_status":"WAITING","speaking_time_seconds":0,"rank":4,"average_rank":4,"total_points":0,"average_score_out_of_10":null,"total_marks_received":null,"question_ranks":{"gdq-1":{"average_rank":5,"rank_position":4,"total_points":0,"votes_count":0,"average_score_out_of_10":0},"gdq-2":{"average_rank":5,"rank_position":4,"total_points":0,"votes_count":0,"average_score_out_of_10":0},"gdq-3":{"average_rank":5,"rank_position":4,"total_points":0,"votes_count":0,"average_score_out_of_10":0},"gdq-4":{"average_rank":5,"rank_position":4,"total_points":0,"votes_count":0,"average_score_out_of_10":0}},"ratings_count":0},{"id":"gdp-5","session_id":"gd-demo-101","student_id":"std-005","student_name":"MAHESAN A","student_reg":"7376252IT236","student_department":"IT","student_community":"AGENTIC AI & LLM OPTIMIZATION","joined_at":"2026-10-11T12:01:20.000Z","status":"JOINED","speaking_order":5,"speaking_status":"WAITING","speaking_time_seconds":0,"rank":5,"average_rank":5,"total_points":0,"average_score_out_of_10":null,"total_marks_received":null,"question_ranks":{"gdq-1":{"average_rank":5,"rank_position":5,"total_points":0,"votes_count":0,"average_score_out_of_10":0},"gdq-2":{"average_rank":5,"rank_position":5,"total_points":0,"votes_count":0,"average_score_out_of_10":0},"gdq-3":{"average_rank":5,"rank_position":5,"total_points":0,"votes_count":0,"average_score_out_of_10":0},"gdq-4":{"average_rank":5,"rank_position":5,"total_points":0,"votes_count":0,"average_score_out_of_10":0}},"ratings_count":0},{"id":"gdp-6","session_id":"gd-demo-101","student_id":"std-006","student_name":"JANANI SUBHA S","student_reg":"7376241CS214","student_department":"CS","student_community":"AGENTIC AI & LLM OPTIMIZATION","joined_at":"2026-10-11T12:01:25.000Z","status":"JOINED","speaking_order":6,"speaking_status":"WAITING","speaking_time_seconds":0,"rank":6,"average_rank":6,"total_points":0,"average_score_out_of_10":null,"total_marks_received":null,"question_ranks":{"gdq-1":{"average_rank":5,"rank_position":6,"total_points":0,"votes_count":0,"average_score_out_of_10":0},"gdq-2":{"average_rank":5,"rank_position":6,"total_points":0,"votes_count":0,"average_score_out_of_10":0},"gdq-3":{"average_rank":5,"rank_position":6,"total_points":0,"votes_count":0,"average_score_out_of_10":0},"gdq-4":{"average_rank":5,"rank_position":6,"total_points":0,"votes_count":0,"average_score_out_of_10":0}},"ratings_count":0},{"id":"gdp-7","session_id":"gd-demo-101","student_id":"std-007","student_name":"TANUSHREE P","student_reg":"7376241CS432","student_department":"CS","student_community":"AGENTIC AI & LLM OPTIMIZATION","joined_at":"2026-10-11T12:01:30.000Z","status":"JOINED","speaking_order":7,"speaking_status":"WAITING","speaking_time_seconds":0,"rank":7,"average_rank":7,"total_points":0,"average_score_out_of_10":null,"total_marks_received":null,"question_ranks":{"gdq-1":{"average_rank":5,"rank_position":7,"total_points":0,"votes_count":0,"average_score_out_of_10":0},"gdq-2":{"average_rank":5,"rank_position":7,"total_points":0,"votes_count":0,"average_score_out_of_10":0},"gdq-3":{"average_rank":5,"rank_position":7,"total_points":0,"votes_count":0,"average_score_out_of_10":0},"gdq-4":{"average_rank":5,"rank_position":7,"total_points":0,"votes_count":0,"average_score_out_of_10":0}},"ratings_count":0},{"id":"gdp-8","session_id":"gd-demo-101","student_id":"std-008","student_name":"DHARANISELVAM P","student_reg":"7376242AD143","student_department":"AD","student_community":"AGENTIC AI & LLM OPTIMIZATION","joined_at":"2026-10-11T12:01:35.000Z","status":"JOINED","speaking_order":8,"speaking_status":"WAITING","speaking_time_seconds":0,"rank":8,"average_rank":8,"total_points":0,"average_score_out_of_10":null,"total_marks_received":null,"question_ranks":{"gdq-1":{"average_rank":5,"rank_position":8,"total_points":0,"votes_count":0,"average_score_out_of_10":0},"gdq-2":{"average_rank":5,"rank_position":8,"total_points":0,"votes_count":0,"average_score_out_of_10":0},"gdq-3":{"average_rank":5,"rank_position":8,"total_points":0,"votes_count":0,"average_score_out_of_10":0},"gdq-4":{"average_rank":5,"rank_position":8,"total_points":0,"votes_count":0,"average_score_out_of_10":0}},"ratings_count":0},{"id":"gdp-9","session_id":"gd-demo-101","student_id":"std-009","student_name":"PRITHIVIKA R","student_reg":"7376242AD258","student_department":"AD","student_community":"AGENTIC AI & LLM OPTIMIZATION","joined_at":"2026-10-11T12:01:40.000Z","status":"JOINED","speaking_order":9,"speaking_status":"WAITING","speaking_time_seconds":0,"rank":9,"average_rank":9,"total_points":0,"average_score_out_of_10":null,"total_marks_received":null,"question_ranks":{"gdq-1":{"average_rank":5,"rank_position":9,"total_points":0,"votes_count":0,"average_score_out_of_10":0},"gdq-2":{"average_rank":5,"rank_position":9,"total_points":0,"votes_count":0,"average_score_out_of_10":0},"gdq-3":{"average_rank":5,"rank_position":9,"total_points":0,"votes_count":0,"average_score_out_of_10":0},"gdq-4":{"average_rank":5,"rank_position":9,"total_points":0,"votes_count":0,"average_score_out_of_10":0}},"ratings_count":0},{"id":"gdp-10","session_id":"gd-demo-101","student_id":"std-010","student_name":"SANJAI V S","student_reg":"7376242AD287","student_department":"AD","student_community":"AGENTIC AI & LLM OPTIMIZATION","joined_at":"2026-10-11T12:01:45.000Z","status":"JOINED","speaking_order":10,"speaking_status":"WAITING","speaking_time_seconds":0,"rank":10,"average_rank":10,"total_points":0,"average_score_out_of_10":null,"total_marks_received":null,"question_ranks":{"gdq-1":{"average_rank":5,"rank_position":10,"total_points":0,"votes_count":0,"average_score_out_of_10":0},"gdq-2":{"average_rank":5,"rank_position":10,"total_points":0,"votes_count":0,"average_score_out_of_10":0},"gdq-3":{"average_rank":5,"rank_position":10,"total_points":0,"votes_count":0,"average_score_out_of_10":0},"gdq-4":{"average_rank":5,"rank_position":10,"total_points":0,"votes_count":0,"average_score_out_of_10":0}},"ratings_count":0}],"gd_peer_evaluations":[],"gd_speaker_ratings":[]}', NOW())
ON DUPLICATE KEY UPDATE `data` = VALUES(`data`), `updated_at` = NOW();

-- 2. Admins Table
CREATE TABLE IF NOT EXISTS `admins` (
  `id` VARCHAR(64) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) UNIQUE NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` VARCHAR(64) NOT NULL DEFAULT 'ADMIN',
  `department` VARCHAR(255) NOT NULL,
  `is_super_admin` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `admins` (`id`, `name`, `email`, `password`, `role`, `department`, `is_super_admin`, `created_at`)
VALUES ('adm-002', 'Pranav (Super Admin)', 'pranavannur9659@gmail.com', '9488529035', 'ADMIN', 'Computer Science & Engineering', 1, '2026-09-05 14:20:00')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `email` = VALUES(`email`), `password` = VALUES(`password`);
INSERT INTO `admins` (`id`, `name`, `email`, `password`, `role`, `department`, `is_super_admin`, `created_at`)
VALUES ('adm-1788626901288', 'YAMUNA RANI R', 'yamunaranir.al25@bitsathy.ac.in', '7376252AL245', 'ADMIN', 'Artificial Intelligence & Data Science', 0, '2026-09-05 16:48:21')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `email` = VALUES(`email`), `password` = VALUES(`password`);

-- 3. Students Table
CREATE TABLE IF NOT EXISTS `students` (
  `id` VARCHAR(64) PRIMARY KEY,
  `student_id` VARCHAR(64) UNIQUE NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) UNIQUE NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `department` VARCHAR(64) NOT NULL,
  `year` INT NOT NULL,
  `community` VARCHAR(255) NOT NULL,
  `skill_level` VARCHAR(64) NOT NULL,
  `profile` TEXT,
  `interest` TEXT,
  `suggested_role` VARCHAR(255),
  `status` VARCHAR(64) NOT NULL DEFAULT 'ACTIVE',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `students` (`id`, `student_id`, `name`, `email`, `password`, `department`, `year`, `community`, `skill_level`, `profile`, `interest`, `suggested_role`, `status`, `created_at`)
VALUES ('std-001', '7376242AD138', 'DEEPIKA J', 'deepikaj.ad24@bitsathy.ac.in', '7376242AD138', 'AD', 3, 'AGENTIC AI & LLM OPTIMIZATION', 'Beginner', 'Learning stage', 'Willing to be a Member', 'Research/Learning', 'ACTIVE', '2026-09-05 09:25:51')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `email` = VALUES(`email`), `password` = VALUES(`password`);
INSERT INTO `students` (`id`, `student_id`, `name`, `email`, `password`, `department`, `year`, `community`, `skill_level`, `profile`, `interest`, `suggested_role`, `status`, `created_at`)
VALUES ('std-002', '7376251CS145', 'DEEPIKA V', 'deepika.cs25@bitsathy.ac.in', '7376251CS145', 'CS', 2, 'AGENTIC AI & LLM OPTIMIZATION', 'Beginner', 'Learning stage, No projects, C level 2', 'Willing to be a Member', 'Learning + QA', 'ACTIVE', '2026-09-05 09:25:51')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `email` = VALUES(`email`), `password` = VALUES(`password`);
INSERT INTO `students` (`id`, `student_id`, `name`, `email`, `password`, `department`, `year`, `community`, `skill_level`, `profile`, `interest`, `suggested_role`, `status`, `created_at`)
VALUES ('std-003', '7376252AD242', 'MOHAMED IRFAN R', 'mohamedirfanr.ad25@bitsathy.ac.in', '7376252AD242', 'AD', 2, 'AGENTIC AI & LLM OPTIMIZATION', 'Beginner', 'Learning stage (C:3)', 'Willing to be a Member', 'Learning + Coding', 'ACTIVE', '2026-09-05 09:25:51')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `email` = VALUES(`email`), `password` = VALUES(`password`);
INSERT INTO `students` (`id`, `student_id`, `name`, `email`, `password`, `department`, `year`, `community`, `skill_level`, `profile`, `interest`, `suggested_role`, `status`, `created_at`)
VALUES ('std-004', '7376252AD320', 'SELVA RITHIKA S', 'selvarithikas.ad25@bitsathy.ac.in', '7376252AD320', 'AD', 2, 'AGENTIC AI & LLM OPTIMIZATION', 'Beginner', 'C Level: 2, HTML, CSS', 'Willing to be a Member', 'Frontend Support', 'ACTIVE', '2026-09-05 09:25:51')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `email` = VALUES(`email`), `password` = VALUES(`password`);
INSERT INTO `students` (`id`, `student_id`, `name`, `email`, `password`, `department`, `year`, `community`, `skill_level`, `profile`, `interest`, `suggested_role`, `status`, `created_at`)
VALUES ('std-005', '7376252IT236', 'MAHESAN A', 'mahesana.it25@bitsathy.ac.in', '7376252IT236', 'IT', 2, 'AGENTIC AI & LLM OPTIMIZATION', 'Strong coding', 'Learning stage (C:5, C++:3, Java:3, Python:3, LeetCode:440)', 'Willing to be a Member', 'Technical Lead/Builder', 'ACTIVE', '2026-09-05 09:25:51')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `email` = VALUES(`email`), `password` = VALUES(`password`);
INSERT INTO `students` (`id`, `student_id`, `name`, `email`, `password`, `department`, `year`, `community`, `skill_level`, `profile`, `interest`, `suggested_role`, `status`, `created_at`)
VALUES ('std-006', '7376241CS214', 'JANANI SUBHA S', 'jananisubhas.cs24@bitsathy.ac.in', '7376241CS214', 'CS', 3, 'AGENTIC AI & LLM OPTIMIZATION', 'Beginner', 'Learning stage', 'Willing to be a Member', 'Learning', 'ACTIVE', '2026-09-05 09:25:51')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `email` = VALUES(`email`), `password` = VALUES(`password`);
INSERT INTO `students` (`id`, `student_id`, `name`, `email`, `password`, `department`, `year`, `community`, `skill_level`, `profile`, `interest`, `suggested_role`, `status`, `created_at`)
VALUES ('std-007', '7376241CS432', 'TANUSHREE P', 'tanushreep.cs24@bitsathy.ac.in', '7376241CS432', 'CS', 3, 'AGENTIC AI & LLM OPTIMIZATION', 'Unspecified', 'Operations & Documentation', 'Willing to be a Member', 'Operations/Documentation', 'ACTIVE', '2026-09-05 09:25:51')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `email` = VALUES(`email`), `password` = VALUES(`password`);
INSERT INTO `students` (`id`, `student_id`, `name`, `email`, `password`, `department`, `year`, `community`, `skill_level`, `profile`, `interest`, `suggested_role`, `status`, `created_at`)
VALUES ('std-008', '7376242AD143', 'DHARANISELVAM P', 'dharaniselvamp.ad24@bitsathy.ac.in', '7376242AD143', 'AD', 3, 'AGENTIC AI & LLM OPTIMIZATION', 'Unspecified', 'Research & Documentation', 'Willing to be a Member', 'Research/Documentation', 'ACTIVE', '2026-09-05 09:25:51')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `email` = VALUES(`email`), `password` = VALUES(`password`);
INSERT INTO `students` (`id`, `student_id`, `name`, `email`, `password`, `department`, `year`, `community`, `skill_level`, `profile`, `interest`, `suggested_role`, `status`, `created_at`)
VALUES ('std-009', '7376242AD258', 'PRITHIVIKA R', 'prithivikar.ad24@bitsathy.ac.in', '7376242AD258', 'AD', 3, 'AGENTIC AI & LLM OPTIMIZATION', 'Unspecified', 'Research & Documentation', 'Willing to be a Member', 'Research/Documentation', 'ACTIVE', '2026-09-05 09:25:51')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `email` = VALUES(`email`), `password` = VALUES(`password`);
INSERT INTO `students` (`id`, `student_id`, `name`, `email`, `password`, `department`, `year`, `community`, `skill_level`, `profile`, `interest`, `suggested_role`, `status`, `created_at`)
VALUES ('std-010', '7376242AD287', 'SANJAI V S', 'sanjaivs.ad24@bitsathy.ac.in', '7376242AD287', 'AD', 3, 'AGENTIC AI & LLM OPTIMIZATION', 'Unspecified', 'Operations', 'Willing to be a Member', 'Operations', 'ACTIVE', '2026-09-05 09:25:51')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `email` = VALUES(`email`), `password` = VALUES(`password`);
INSERT INTO `students` (`id`, `student_id`, `name`, `email`, `password`, `department`, `year`, `community`, `skill_level`, `profile`, `interest`, `suggested_role`, `status`, `created_at`)
VALUES ('std-011', '7376242AL180', 'RUDHRAN B', 'rudhranb.al24@bitsathy.ac.in', '7376242AL180', 'AL', 3, 'AGENTIC AI & LLM OPTIMIZATION', 'Project + coding', 'C:3, C++:2, Python:2, HTML/CSS completed, AI project completed, Learning stage', 'Willing to be a Member', 'AI Project Builder', 'ACTIVE', '2026-09-05 09:25:51')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `email` = VALUES(`email`), `password` = VALUES(`password`);
INSERT INTO `students` (`id`, `student_id`, `name`, `email`, `password`, `department`, `year`, `community`, `skill_level`, `profile`, `interest`, `suggested_role`, `status`, `created_at`)
VALUES ('std-012', '7376242IT295', 'SHASVIN D', 'shasvind.it24@bitsathy.ac.in', '7376242IT295', 'IT', 3, 'AGENTIC AI & LLM OPTIMIZATION', 'Intermediate', 'Intermediate, Python Level 3', 'Willing to be a Member', 'Python Builder', 'ACTIVE', '2026-09-05 09:25:51')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `email` = VALUES(`email`), `password` = VALUES(`password`);
INSERT INTO `students` (`id`, `student_id`, `name`, `email`, `password`, `department`, `year`, `community`, `skill_level`, `profile`, `interest`, `suggested_role`, `status`, `created_at`)
VALUES ('std-013', '7376251CS214', 'HASIKA V', 'hasikav.cs25@bitsathy.ac.in', '7376251CS214', 'CS', 2, 'AGENTIC AI & LLM OPTIMIZATION', 'Beginner', 'Learning stage (C level 1)', 'Willing to be a Member', 'Learning + QA', 'ACTIVE', '2026-09-05 09:25:51')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `email` = VALUES(`email`), `password` = VALUES(`password`);
INSERT INTO `students` (`id`, `student_id`, `name`, `email`, `password`, `department`, `year`, `community`, `skill_level`, `profile`, `interest`, `suggested_role`, `status`, `created_at`)
VALUES ('std-014', '7376251CS283', 'MATHI PRIYAN M', 'mathipriyanm.cs25@bitsathy.ac.in', '7376251CS283', 'CS', 2, 'AGENTIC AI & LLM OPTIMIZATION', 'Unspecified', 'Learning stage', 'Willing to be a Member', 'Learning', 'ACTIVE', '2026-09-05 09:25:51')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `email` = VALUES(`email`), `password` = VALUES(`password`);
INSERT INTO `students` (`id`, `student_id`, `name`, `email`, `password`, `department`, `year`, `community`, `skill_level`, `profile`, `interest`, `suggested_role`, `status`, `created_at`)
VALUES ('std-015', '7376251CS371', 'ROHITH S', 'rohiths.cs25@bitsathy.ac.in', '7376251CS371', 'CS', 2, 'AGENTIC AI & LLM OPTIMIZATION', 'LLM project', 'Completed 1 project in LLM (C level 1, HTML/CSS)', 'Willing to be a Member', 'LLM Project Builder', 'ACTIVE', '2026-09-05 09:25:51')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `email` = VALUES(`email`), `password` = VALUES(`password`);
INSERT INTO `students` (`id`, `student_id`, `name`, `email`, `password`, `department`, `year`, `community`, `skill_level`, `profile`, `interest`, `suggested_role`, `status`, `created_at`)
VALUES ('std-016', '7376251CS504', 'ANGESH KARTHIK S', 'angeshkarthiks.cs24@bitsathy.ac.in', '7376251CS504', 'CS', 3, 'AGENTIC AI & LLM OPTIMIZATION', 'Strong coding', 'C:3, Java/C++/Python:2, HTML/CSS, GitHub, LeetCode:155, Learning stage', 'Willing to be a Member', 'Coding/Tech Support', 'ACTIVE', '2026-09-05 09:25:51')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `email` = VALUES(`email`), `password` = VALUES(`password`);
INSERT INTO `students` (`id`, `student_id`, `name`, `email`, `password`, `department`, `year`, `community`, `skill_level`, `profile`, `interest`, `suggested_role`, `status`, `created_at`)
VALUES ('std-017', '7376252AD144', 'DEVAPRASANNA S', 'devaprasannas.ad25@bitsathy.ac.in', '7376252AD144', 'AD', 2, 'AGENTIC AI & LLM OPTIMIZATION', 'Backend beginner', 'C:3, NodeJS, Learning stage', 'Willing to be a Member', 'Backend Builder', 'ACTIVE', '2026-09-05 09:25:51')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `email` = VALUES(`email`), `password` = VALUES(`password`);
INSERT INTO `students` (`id`, `student_id`, `name`, `email`, `password`, `department`, `year`, `community`, `skill_level`, `profile`, `interest`, `suggested_role`, `status`, `created_at`)
VALUES ('std-018', '7376252AD221', 'KRISHNAKUMAR S', 'krishnakumars.ad25@bitsathy.ac.in', '7376252AD221', 'AD', 2, 'AGENTIC AI & LLM OPTIMIZATION', 'Unspecified', 'Learning stage', 'Willing to be a Member', 'Learning', 'ACTIVE', '2026-09-05 09:25:51')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `email` = VALUES(`email`), `password` = VALUES(`password`);
INSERT INTO `students` (`id`, `student_id`, `name`, `email`, `password`, `department`, `year`, `community`, `skill_level`, `profile`, `interest`, `suggested_role`, `status`, `created_at`)
VALUES ('std-019', '7376252AL134', 'HARINDRA S', 'harindras.al25@bitsathy.ac.in', '7376252AL134', 'AL', 2, 'AGENTIC AI & LLM OPTIMIZATION', 'Beginner', 'Learning stage, No projects, C level 3', 'Willing to be a Member', 'Learning', 'ACTIVE', '2026-09-05 09:25:51')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `email` = VALUES(`email`), `password` = VALUES(`password`);
INSERT INTO `students` (`id`, `student_id`, `name`, `email`, `password`, `department`, `year`, `community`, `skill_level`, `profile`, `interest`, `suggested_role`, `status`, `created_at`)
VALUES ('std-020', '7376252AL204', 'SAHITHYA K', 'sahithyak.al25@bitsathy.ac.in', '7376252AL204', 'AL', 2, 'AGENTIC AI & LLM OPTIMIZATION', 'Beginner', 'Learning stage, C:1, HTML/CSS:1, LeetCode:4', 'Willing to be a Member', 'Frontend Support', 'ACTIVE', '2026-09-05 09:25:51')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `email` = VALUES(`email`), `password` = VALUES(`password`);
INSERT INTO `students` (`id`, `student_id`, `name`, `email`, `password`, `department`, `year`, `community`, `skill_level`, `profile`, `interest`, `suggested_role`, `status`, `created_at`)
VALUES ('std-021', '7376252IT121', 'BAVADHARANI S', 'bavadharanis.it25@bitsathy.ac.in', '7376252IT121', 'IT', 2, 'AGENTIC AI & LLM OPTIMIZATION', 'Project experience', 'Learning stage, 2 projects completed, C level 4', 'Willing to be a Member', 'Project Builder', 'ACTIVE', '2026-09-05 09:25:51')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `email` = VALUES(`email`), `password` = VALUES(`password`);
INSERT INTO `students` (`id`, `student_id`, `name`, `email`, `password`, `department`, `year`, `community`, `skill_level`, `profile`, `interest`, `suggested_role`, `status`, `created_at`)
VALUES ('std-022', '7376252IT195', 'JAYASRI C', 'jayasric.it25@bitsathy.ac.in', '7376252IT195', 'IT', 2, 'AGENTIC AI & LLM OPTIMIZATION', 'Web basics', 'Learning stage, Cisco HTML & CSS course completed online', 'Willing to be a Member', 'Frontend Support', 'ACTIVE', '2026-09-05 09:25:51')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `email` = VALUES(`email`), `password` = VALUES(`password`);
INSERT INTO `students` (`id`, `student_id`, `name`, `email`, `password`, `department`, `year`, `community`, `skill_level`, `profile`, `interest`, `suggested_role`, `status`, `created_at`)
VALUES ('std-023', '7376252IT293', 'RAJAMANI S', 'rajamanis.it25@bitsathy.ac.in', '7376252IT293', 'IT', 2, 'AGENTIC AI & LLM OPTIMIZATION', 'Beginner', 'Learning stage', 'Willing to be a Member', 'Learning', 'ACTIVE', '2026-09-05 09:25:51')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `email` = VALUES(`email`), `password` = VALUES(`password`);
INSERT INTO `students` (`id`, `student_id`, `name`, `email`, `password`, `department`, `year`, `community`, `skill_level`, `profile`, `interest`, `suggested_role`, `status`, `created_at`)
VALUES ('std-024', '7376252AD289', 'REVANTH A', 'revantha.ad25@bitsathy.ac.in', '7376252AD289', 'AD', 2, 'NATURAL LANGUAGE PROCESSING', 'NLP learner', 'Learning stage, No projects', 'Willing to be a Member', 'NLP/LLM Learning', 'ACTIVE', '2026-09-05 09:25:51')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `email` = VALUES(`email`), `password` = VALUES(`password`);
INSERT INTO `students` (`id`, `student_id`, `name`, `email`, `password`, `department`, `year`, `community`, `skill_level`, `profile`, `interest`, `suggested_role`, `status`, `created_at`)
VALUES ('std-025', '7376252IT280', 'Student (7376252IT280)', '7376252it280@college.edu', '7376252IT280', 'IT', 3, 'Agentic AI & LLM Optimization', 'Intermediate', 'Learning stage', 'Willing to be a Member', 'AI Systems Engineer', 'ACTIVE', '2026-09-05 09:25:51')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `email` = VALUES(`email`), `password` = VALUES(`password`);

-- 4. GD Sessions Table
CREATE TABLE IF NOT EXISTS `gd_sessions` (
  `id` VARCHAR(64) PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `topic` TEXT NOT NULL,
  `description` TEXT,
  `pin` VARCHAR(32),
  `guidelines` TEXT,
  `target_community` VARCHAR(255),
  `department` VARCHAR(64),
  `date` VARCHAR(32),
  `start_time` VARCHAR(32),
  `duration_minutes` INT,
  `time_per_candidate_seconds` INT DEFAULT 180,
  `max_participants` INT DEFAULT 10,
  `min_evaluators_per_candidate` INT DEFAULT 3,
  `evaluation_criteria` JSON,
  `speaker_duration_limit_seconds` INT DEFAULT 120,
  `status` VARCHAR(64) DEFAULT 'UPCOMING',
  `created_by` VARCHAR(64),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `gd_sessions` (`id`, `title`, `topic`, `description`, `pin`, `guidelines`, `target_community`, `department`, `date`, `start_time`, `duration_minutes`, `time_per_candidate_seconds`, `max_participants`, `min_evaluators_per_candidate`, `evaluation_criteria`, `speaker_duration_limit_seconds`, `status`, `created_by`, `created_at`)
VALUES ('gd-demo-101', 'Campus Cohort GD: Autonomous AI Systems in Industry', 'Will autonomous multi-agent AI ecosystems transform software engineering or create critical security bottlenecks?', 'Turn-based 10-candidate discussion. Each speaker takes the floor with live timer. Cohort peers award marks (1-10) on discussion questions and speaking duration is recorded.', '789123', NULL, NULL, NULL, NULL, NULL, 25, 180, 10, 3, '[]', 120, 'ACTIVE', 'adm-002', '2026-10-11 12:00:00')
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `topic` = VALUES(`topic`);

-- 5. GD Participants Table (Using backticks for reserved keyword 'rank')
CREATE TABLE IF NOT EXISTS `gd_participants` (
  `id` VARCHAR(64) PRIMARY KEY,
  `session_id` VARCHAR(64) NOT NULL,
  `student_id` VARCHAR(64) NOT NULL,
  `student_name` VARCHAR(255) NOT NULL,
  `student_reg` VARCHAR(64) NOT NULL,
  `student_department` VARCHAR(64),
  `student_community` VARCHAR(255),
  `speaking_order` INT DEFAULT 1,
  `speaking_status` VARCHAR(64) DEFAULT 'PENDING',
  `speaking_time_seconds` INT DEFAULT 0,
  `rank` INT DEFAULT 0,
  `total_points` FLOAT DEFAULT 0,
  `joined_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `gd_participants` (`id`, `session_id`, `student_id`, `student_name`, `student_reg`, `student_department`, `student_community`, `speaking_order`, `speaking_status`, `speaking_time_seconds`, `rank`, `total_points`, `joined_at`)
VALUES ('gdp-1', 'gd-demo-101', 'std-001', 'DEEPIKA J', '7376242AD138', 'AD', 'AGENTIC AI & LLM OPTIMIZATION', 1, 'WAITING', 0, 1, 0, '2026-10-11 12:01:00')
ON DUPLICATE KEY UPDATE `student_name` = VALUES(`student_name`);
INSERT INTO `gd_participants` (`id`, `session_id`, `student_id`, `student_name`, `student_reg`, `student_department`, `student_community`, `speaking_order`, `speaking_status`, `speaking_time_seconds`, `rank`, `total_points`, `joined_at`)
VALUES ('gdp-2', 'gd-demo-101', 'std-002', 'DEEPIKA V', '7376251CS145', 'CS', 'AGENTIC AI & LLM OPTIMIZATION', 2, 'WAITING', 0, 2, 0, '2026-10-11 12:01:05')
ON DUPLICATE KEY UPDATE `student_name` = VALUES(`student_name`);
INSERT INTO `gd_participants` (`id`, `session_id`, `student_id`, `student_name`, `student_reg`, `student_department`, `student_community`, `speaking_order`, `speaking_status`, `speaking_time_seconds`, `rank`, `total_points`, `joined_at`)
VALUES ('gdp-3', 'gd-demo-101', 'std-003', 'MOHAMED IRFAN R', '7376252AD242', 'AD', 'AGENTIC AI & LLM OPTIMIZATION', 3, 'WAITING', 0, 3, 0, '2026-10-11 12:01:10')
ON DUPLICATE KEY UPDATE `student_name` = VALUES(`student_name`);
INSERT INTO `gd_participants` (`id`, `session_id`, `student_id`, `student_name`, `student_reg`, `student_department`, `student_community`, `speaking_order`, `speaking_status`, `speaking_time_seconds`, `rank`, `total_points`, `joined_at`)
VALUES ('gdp-4', 'gd-demo-101', 'std-004', 'SELVA RITHIKA S', '7376252AD320', 'AD', 'AGENTIC AI & LLM OPTIMIZATION', 4, 'WAITING', 0, 4, 0, '2026-10-11 12:01:15')
ON DUPLICATE KEY UPDATE `student_name` = VALUES(`student_name`);
INSERT INTO `gd_participants` (`id`, `session_id`, `student_id`, `student_name`, `student_reg`, `student_department`, `student_community`, `speaking_order`, `speaking_status`, `speaking_time_seconds`, `rank`, `total_points`, `joined_at`)
VALUES ('gdp-5', 'gd-demo-101', 'std-005', 'MAHESAN A', '7376252IT236', 'IT', 'AGENTIC AI & LLM OPTIMIZATION', 5, 'WAITING', 0, 5, 0, '2026-10-11 12:01:20')
ON DUPLICATE KEY UPDATE `student_name` = VALUES(`student_name`);
INSERT INTO `gd_participants` (`id`, `session_id`, `student_id`, `student_name`, `student_reg`, `student_department`, `student_community`, `speaking_order`, `speaking_status`, `speaking_time_seconds`, `rank`, `total_points`, `joined_at`)
VALUES ('gdp-6', 'gd-demo-101', 'std-006', 'JANANI SUBHA S', '7376241CS214', 'CS', 'AGENTIC AI & LLM OPTIMIZATION', 6, 'WAITING', 0, 6, 0, '2026-10-11 12:01:25')
ON DUPLICATE KEY UPDATE `student_name` = VALUES(`student_name`);
INSERT INTO `gd_participants` (`id`, `session_id`, `student_id`, `student_name`, `student_reg`, `student_department`, `student_community`, `speaking_order`, `speaking_status`, `speaking_time_seconds`, `rank`, `total_points`, `joined_at`)
VALUES ('gdp-7', 'gd-demo-101', 'std-007', 'TANUSHREE P', '7376241CS432', 'CS', 'AGENTIC AI & LLM OPTIMIZATION', 7, 'WAITING', 0, 7, 0, '2026-10-11 12:01:30')
ON DUPLICATE KEY UPDATE `student_name` = VALUES(`student_name`);
INSERT INTO `gd_participants` (`id`, `session_id`, `student_id`, `student_name`, `student_reg`, `student_department`, `student_community`, `speaking_order`, `speaking_status`, `speaking_time_seconds`, `rank`, `total_points`, `joined_at`)
VALUES ('gdp-8', 'gd-demo-101', 'std-008', 'DHARANISELVAM P', '7376242AD143', 'AD', 'AGENTIC AI & LLM OPTIMIZATION', 8, 'WAITING', 0, 8, 0, '2026-10-11 12:01:35')
ON DUPLICATE KEY UPDATE `student_name` = VALUES(`student_name`);
INSERT INTO `gd_participants` (`id`, `session_id`, `student_id`, `student_name`, `student_reg`, `student_department`, `student_community`, `speaking_order`, `speaking_status`, `speaking_time_seconds`, `rank`, `total_points`, `joined_at`)
VALUES ('gdp-9', 'gd-demo-101', 'std-009', 'PRITHIVIKA R', '7376242AD258', 'AD', 'AGENTIC AI & LLM OPTIMIZATION', 9, 'WAITING', 0, 9, 0, '2026-10-11 12:01:40')
ON DUPLICATE KEY UPDATE `student_name` = VALUES(`student_name`);
INSERT INTO `gd_participants` (`id`, `session_id`, `student_id`, `student_name`, `student_reg`, `student_department`, `student_community`, `speaking_order`, `speaking_status`, `speaking_time_seconds`, `rank`, `total_points`, `joined_at`)
VALUES ('gdp-10', 'gd-demo-101', 'std-010', 'SANJAI V S', '7376242AD287', 'AD', 'AGENTIC AI & LLM OPTIMIZATION', 10, 'WAITING', 0, 10, 0, '2026-10-11 12:01:45')
ON DUPLICATE KEY UPDATE `student_name` = VALUES(`student_name`);

-- 6. Assessments Table
CREATE TABLE IF NOT EXISTS `assessments` (
  `id` VARCHAR(64) PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `type` VARCHAR(64) NOT NULL,
  `question_selection_mode` VARCHAR(64) NOT NULL DEFAULT 'FIXED',
  `community` VARCHAR(255),
  `department` VARCHAR(255),
  `target_type` VARCHAR(64) NOT NULL DEFAULT 'ALL',
  `duration_minutes` INT NOT NULL,
  `start_time` DATETIME,
  `end_time` DATETIME,
  `passing_percentage` FLOAT NOT NULL,
  `max_marks` FLOAT NOT NULL,
  `status` VARCHAR(64) NOT NULL DEFAULT 'DRAFT',
  `created_by` VARCHAR(64),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `assessments` (`id`, `title`, `description`, `type`, `question_selection_mode`, `community`, `department`, `target_type`, `duration_minutes`, `start_time`, `end_time`, `passing_percentage`, `max_marks`, `status`, `created_by`, `created_at`)
VALUES ('ass-001', 'Agentic AI & Prompt Engineering Level 1', 'First mandatory evaluation covering ReAct pattern, RAG basics, and CoT reasoning.', 'HYBRID', 'FIXED', NULL, NULL, 'ALL', 30, '2026-09-09 09:07:49', '2026-09-17 09:07:49', 60, 14, 'PUBLISHED', 'adm-002', '2026-09-10 09:07:49')
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);
INSERT INTO `assessments` (`id`, `title`, `description`, `type`, `question_selection_mode`, `community`, `department`, `target_type`, `duration_minutes`, `start_time`, `end_time`, `passing_percentage`, `max_marks`, `status`, `created_by`, `created_at`)
VALUES ('ass-002', 'Advanced LLM Architecture & Pool Test', 'Randomized draw assessment from the Agentic AI Core pool.', 'HYBRID', 'RANDOMIZED_POOL', 'Agentic AI & LLM Optimization', NULL, 'COMMUNITY', 45, '2026-09-09 09:07:49', '2026-09-17 09:07:49', 70, 12, 'PUBLISHED', 'adm-002', '2026-09-10 09:07:49')
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- 7. Questions Table
CREATE TABLE IF NOT EXISTS `questions` (
  `id` VARCHAR(64) PRIMARY KEY,
  `source_pdf_id` VARCHAR(64),
  `question_type` VARCHAR(64) NOT NULL,
  `question_text` TEXT NOT NULL,
  `option_a` TEXT,
  `option_b` TEXT,
  `option_c` TEXT,
  `option_d` TEXT,
  `correct_answer` TEXT,
  `explanation` TEXT,
  `rubric` TEXT,
  `expected_answer` TEXT,
  `marks` FLOAT NOT NULL DEFAULT 1,
  `difficulty` VARCHAR(64) NOT NULL DEFAULT 'Medium',
  `topic` VARCHAR(255),
  `status` VARCHAR(64) NOT NULL DEFAULT 'APPROVED',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `questions` (`id`, `source_pdf_id`, `question_type`, `question_text`, `option_a`, `option_b`, `option_c`, `option_d`, `correct_answer`, `explanation`, `rubric`, `expected_answer`, `marks`, `difficulty`, `topic`, `status`, `created_at`)
VALUES ('q-001', 'mat-001', 'MCQ', 'What is the core distinction of a ReAct (Reasoning + Acting) agent compared to a standard prompt pipeline?', 'It executes code natively without external tools', 'It interleaves reasoning step thoughts with tool execution observations in an iterative loop', 'It pre-compiles all decision paths before execution', 'It relies solely on zero-shot memory search', 'B', 'ReAct agents iteratively generate reasoning traces (Thought) and actions (Tool invocation), observing tool outputs before deciding the next step.', NULL, NULL, 2, 'Medium', 'Agentic Workflows', 'APPROVED', '2026-09-10 09:07:49')
ON DUPLICATE KEY UPDATE `question_text` = VALUES(`question_text`);
INSERT INTO `questions` (`id`, `source_pdf_id`, `question_type`, `question_text`, `option_a`, `option_b`, `option_c`, `option_d`, `correct_answer`, `explanation`, `rubric`, `expected_answer`, `marks`, `difficulty`, `topic`, `status`, `created_at`)
VALUES ('q-002', 'mat-001', 'MCQ', 'Which component in a RAG (Retrieval-Augmented Generation) system converts unstructured text into dense semantic vector representations?', 'Tokenizer', 'Embedding Model', 'Cross-Encoder Reranker', 'Decoder Head', 'B', 'Embedding models map text chunks into high-dimensional vector spaces where semantic similarity can be computed via cosine distance.', NULL, NULL, 2, 'Easy', 'RAG Systems', 'APPROVED', '2026-09-10 09:07:49')
ON DUPLICATE KEY UPDATE `question_text` = VALUES(`question_text`);
INSERT INTO `questions` (`id`, `source_pdf_id`, `question_type`, `question_text`, `option_a`, `option_b`, `option_c`, `option_d`, `correct_answer`, `explanation`, `rubric`, `expected_answer`, `marks`, `difficulty`, `topic`, `status`, `created_at`)
VALUES ('q-003', 'mat-002', 'MCQ', 'What is the primary advantage of FlashAttention over standard Multi-Head Attention in modern LLM architectures?', 'It eliminates the need for Positional Embeddings', 'It reduces memory IO complexity from quadratic O(N?) to linear by tiling GPU SRAM operations', 'It converts self-attention into feed-forward layers', 'It increases vocabulary size automatically', 'B', 'FlashAttention optimizes GPU memory bandwidth by executing attention matrix computation in SRAM tiles without writing full N x N matrices to HBM.', NULL, NULL, 2, 'Hard', 'LLM Architectures', 'APPROVED', '2026-09-10 09:07:49')
ON DUPLICATE KEY UPDATE `question_text` = VALUES(`question_text`);
INSERT INTO `questions` (`id`, `source_pdf_id`, `question_type`, `question_text`, `option_a`, `option_b`, `option_c`, `option_d`, `correct_answer`, `explanation`, `rubric`, `expected_answer`, `marks`, `difficulty`, `topic`, `status`, `created_at`)
VALUES ('q-004', 'mat-001', 'WRITING', 'Explain the trade-offs between a single centralized orchestrator agent vs. a decentralized multi-agent network for complex software tasks.', NULL, NULL, NULL, NULL, NULL, NULL, 'Centralized: 2 marks for clear single-point control vs complexity. Decentralized: 2 marks for modularity & scalability vs communication overhead. Examples & Clarity: 1 mark.', 'A centralized orchestrator maintains global state and plan clarity, but can become a bottleneck or failure point. Decentralized networks distribute specialized tasks to autonomous worker agents, improving modularity but requiring robust inter-agent protocols.', 5, 'Medium', 'Multi-Agent Systems', 'APPROVED', '2026-09-10 09:07:49')
ON DUPLICATE KEY UPDATE `question_text` = VALUES(`question_text`);
INSERT INTO `questions` (`id`, `source_pdf_id`, `question_type`, `question_text`, `option_a`, `option_b`, `option_c`, `option_d`, `correct_answer`, `explanation`, `rubric`, `expected_answer`, `marks`, `difficulty`, `topic`, `status`, `created_at`)
VALUES ('q-005', 'mat-003', 'WRITING', 'Describe how Chain-of-Thought (CoT) prompting alters model inference and why it improves performance on multi-step reasoning problems.', NULL, NULL, NULL, NULL, NULL, NULL, 'Model compute allocation explanation: 2 marks. Multi-step decomposition: 2 marks. Practical example: 1 mark.', 'Chain-of-Thought forces the model to generate intermediate reasoning tokens, effectively extending sequence-level compute budget before outputting the final answer.', 5, 'Easy', 'Prompt Engineering', 'APPROVED', '2026-09-10 09:07:49')
ON DUPLICATE KEY UPDATE `question_text` = VALUES(`question_text`);

-- 8. Question Pools Table
CREATE TABLE IF NOT EXISTS `question_pools` (
  `id` VARCHAR(64) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `question_pools` (`id`, `name`, `description`, `created_at`)
VALUES ('pool-001', 'Agentic AI Core Pool', 'Master pool of interchangeable MCQ and Writing questions on agentic design.', '2026-09-10 09:07:49')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 9. Study Materials Table
CREATE TABLE IF NOT EXISTS `study_materials` (
  `id` VARCHAR(64) PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `material_type` VARCHAR(64) NOT NULL,
  `file_url` TEXT NOT NULL,
  `page_count` INT,
  `target_type` VARCHAR(64) NOT NULL DEFAULT 'ALL',
  `target_department` VARCHAR(255),
  `target_community` VARCHAR(255),
  `published_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `created_by` VARCHAR(64)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `study_materials` (`id`, `title`, `description`, `material_type`, `file_url`, `page_count`, `target_type`, `target_department`, `target_community`, `published_date`, `created_by`)
VALUES ('mat-001', 'Agentic AI Introduction & Architecture Guidelines', 'Comprehensive starter guide on ReAct, Planning Agents, and Multi-Agent Orchestration.', 'PDF', '/uploads/Agentic_AI_Introduction.pdf', 15, 'ALL', NULL, NULL, '2026-09-10 09:07:49', 'adm-002')
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);
INSERT INTO `study_materials` (`id`, `title`, `description`, `material_type`, `file_url`, `page_count`, `target_type`, `target_department`, `target_community`, `published_date`, `created_by`)
VALUES ('mat-002', 'Transformer Architecture & Attention Mechanisms', 'Deep dive into Multi-Head Self Attention, Positional Encodings, and Encoder-Decoder models.', 'PDF', '/uploads/Transformer_Architecture.pdf', 24, 'COMMUNITY', NULL, 'Agentic AI & LLM Optimization', '2026-09-10 09:07:49', 'adm-002')
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);
INSERT INTO `study_materials` (`id`, `title`, `description`, `material_type`, `file_url`, `page_count`, `target_type`, `target_department`, `target_community`, `published_date`, `created_by`)
VALUES ('mat-003', 'Prompt Engineering & Structured Outputs Guide', 'Best practices for Few-Shot prompting, Chain of Thought, and JSON Schema constraints.', 'URL', 'https://learn.promptengineering.org/advanced-guide', 0, 'ALL', NULL, NULL, '2026-09-10 09:07:49', 'adm-002')
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);
INSERT INTO `study_materials` (`id`, `title`, `description`, `material_type`, `file_url`, `page_count`, `target_type`, `target_department`, `target_community`, `published_date`, `created_by`)
VALUES ('mat-1789325343319', 'Advanced Agentic Workflows & Multi-Agent Systems', 'Comprehensive guide covering tool use, memory architectures, and delegation patterns.', 'PDF', '/uploads/1789325343315-77518515.pdf', 7, 'COMMUNITY', NULL, 'Agentic AI & LLM Optimization', '2026-09-13 18:49:03', 'adm-002')
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);
INSERT INTO `study_materials` (`id`, `title`, `description`, `material_type`, `file_url`, `page_count`, `target_type`, `target_department`, `target_community`, `published_date`, `created_by`)
VALUES ('mat-1789325343336', 'Official LangGraph & AutoGen Documentation', 'Official developer guides and orchestration frameworks.', 'URL', 'https://langchain-ai.github.io/langgraph/', 0, 'ALL', NULL, NULL, '2026-09-13 18:49:03', 'adm-002')
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);
INSERT INTO `study_materials` (`id`, `title`, `description`, `material_type`, `file_url`, `page_count`, `target_type`, `target_department`, `target_community`, `published_date`, `created_by`)
VALUES ('mat-url-001', 'Hugging Face Hub & Transformers Documentation', 'Explore open-source models, pipelines, fine-tuning datasets, tokenizers, and active community spaces.', 'URL', 'https://huggingface.co/docs', 0, 'ALL', NULL, NULL, '2026-10-09 19:09:44', 'adm-002')
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);
INSERT INTO `study_materials` (`id`, `title`, `description`, `material_type`, `file_url`, `page_count`, `target_type`, `target_department`, `target_community`, `published_date`, `created_by`)
VALUES ('mat-url-002', 'DeepLearning.AI Agentic Systems & Short Courses', 'Comprehensive video tutorials and code labs on ReAct, Function Calling, and Multi-Agent Orchestration.', 'URL', 'https://www.deeplearning.ai/short-courses/', 0, 'COMMUNITY', NULL, 'Agentic AI & LLM Optimization', '2026-10-09 19:09:44', 'adm-002')
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);
INSERT INTO `study_materials` (`id`, `title`, `description`, `material_type`, `file_url`, `page_count`, `target_type`, `target_department`, `target_community`, `published_date`, `created_by`)
VALUES ('mat-url-003', 'Anthropic Claude Documentation & Workbench', 'Official developer guidance on prompt evaluation, structured JSON outputs, and agentic workflows.', 'URL', 'https://docs.anthropic.com/', 0, 'ALL', NULL, NULL, '2026-10-09 19:09:44', 'adm-002')
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);
INSERT INTO `study_materials` (`id`, `title`, `description`, `material_type`, `file_url`, `page_count`, `target_type`, `target_department`, `target_community`, `published_date`, `created_by`)
VALUES ('mat-url-004', 'Fast.ai Practical Deep Learning for Coders', 'Hands-on top-down curriculum covering PyTorch fundamentals, computer vision, NLP, and model training.', 'URL', 'https://course.fast.ai/', 0, 'ALL', NULL, NULL, '2026-10-09 19:09:44', 'adm-002')
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);
INSERT INTO `study_materials` (`id`, `title`, `description`, `material_type`, `file_url`, `page_count`, `target_type`, `target_department`, `target_community`, `published_date`, `created_by`)
VALUES ('mat-url-005', 'OpenAI Developer Platform & Function Calling Guide', 'Production guides for tool calling, assistants API, structured reasoning, and multi-agent systems.', 'URL', 'https://platform.openai.com/docs/guides/function-calling', 0, 'COMMUNITY', NULL, 'Agentic AI & LLM Optimization', '2026-10-09 19:09:44', 'adm-002')
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- 10. Attendance Sessions Table
CREATE TABLE IF NOT EXISTS `attendance_sessions` (
  `id` VARCHAR(64) PRIMARY KEY,
  `community` VARCHAR(255),
  `department` VARCHAR(255),
  `date` VARCHAR(32) NOT NULL,
  `code` VARCHAR(32) NOT NULL,
  `start_time` DATETIME,
  `expires_at` DATETIME,
  `created_by` VARCHAR(64)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `attendance_sessions` (`id`, `community`, `department`, `date`, `code`, `start_time`, `expires_at`, `created_by`)
VALUES ('sess-001', 'Agentic AI & LLM Optimization', 'ALL', '2026-09-03', '8K4P7Q', '2026-09-03 09:58:32', '2026-09-03 11:58:32', 'adm-001')
ON DUPLICATE KEY UPDATE `code` = VALUES(`code`);
INSERT INTO `attendance_sessions` (`id`, `community`, `department`, `date`, `code`, `start_time`, `expires_at`, `created_by`)
VALUES ('sess-1788430534174', 'Agentic AI & LLM Optimization', 'ALL', '2026-09-03', '83BTVC', '2026-09-03 10:15:34', '2026-09-03 11:15:34', 'adm-001')
ON DUPLICATE KEY UPDATE `code` = VALUES(`code`);
INSERT INTO `attendance_sessions` (`id`, `community`, `department`, `date`, `code`, `start_time`, `expires_at`, `created_by`)
VALUES ('sess-1788430884250', 'Agentic AI & LLM Optimization', 'ALL', '2026-09-03', 'F2GF44', '2026-09-03 10:21:24', '2026-09-03 10:26:24', 'adm-001')
ON DUPLICATE KEY UPDATE `code` = VALUES(`code`);

-- 11. Attendance Records Table
CREATE TABLE IF NOT EXISTS `attendance_records` (
  `id` VARCHAR(64) PRIMARY KEY,
  `session_id` VARCHAR(64) NOT NULL,
  `student_id` VARCHAR(64) NOT NULL,
  `marked_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `status` VARCHAR(64) NOT NULL DEFAULT 'PRESENT',
  UNIQUE KEY `unique_session_student` (`session_id`, `student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `attendance_records` (`id`, `session_id`, `student_id`, `marked_at`, `status`)
VALUES ('76e419cd-db90-4685-b0b5-a468df4759e1', 'sess-001', 'std-001', '2026-09-03 09:58:32', 'PRESENT')
ON DUPLICATE KEY UPDATE `status` = VALUES(`status`);
INSERT INTO `attendance_records` (`id`, `session_id`, `student_id`, `marked_at`, `status`)
VALUES ('attrec-1788430581456', 'sess-001', 'std-002', '2026-09-03 10:16:21', 'PRESENT')
ON DUPLICATE KEY UPDATE `status` = VALUES(`status`);

-- 12. Notifications Table
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` VARCHAR(64) PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `target_type` VARCHAR(64) NOT NULL DEFAULT 'ALL',
  `priority` VARCHAR(64) NOT NULL DEFAULT 'NORMAL',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `notifications` (`id`, `title`, `message`, `target_type`, `priority`, `created_at`)
VALUES ('89023de5-b5ce-4a98-b5cf-664944dd8fe3', 'Welcome to Student Assessment Portal v2', 'Explore study materials, complete assigned assessments, and ask AI doubts directly!', 'ALL', 'IMPORTANT', '2026-09-10 09:07:49')
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);
INSERT INTO `notifications` (`id`, `title`, `message`, `target_type`, `priority`, `created_at`)
VALUES ('74ab6ca7-0b48-485a-a69d-84431fdf8823', 'New Assessment Available: Agentic AI Level 1', 'The assessment is now active. Please complete it before the deadline.', 'ALL', 'NORMAL', '2026-09-10 09:07:49')
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- 13. Meetings Table
CREATE TABLE IF NOT EXISTS `meetings` (
  `id` VARCHAR(64) PRIMARY KEY,
  `code` VARCHAR(64) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `host_id` VARCHAR(64),
  `host_name` VARCHAR(255),
  `host_email` VARCHAR(255),
  `meeting_type` VARCHAR(64) DEFAULT 'VIDEO_VOICE',
  `audience_type` VARCHAR(64) DEFAULT 'ALL_STUDENTS',
  `status` VARCHAR(64) DEFAULT 'ACTIVE',
  `scheduled_start_time` DATETIME,
  `actual_start_time` DATETIME,
  `external_link` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `meetings` (`id`, `code`, `title`, `description`, `host_id`, `host_name`, `host_email`, `meeting_type`, `audience_type`, `status`, `scheduled_start_time`, `actual_start_time`, `external_link`, `created_at`)
VALUES ('meet-1791570854126-ai001', 'abc-defg-hij', 'Agentic AI & Neural Systems Workshop (Live Meet)', 'Interactive live video & audio discussion, Q&A on neural architectures, and model evaluations.', 'adm-002', 'Pranav (Super Admin)', 'pranavannur9659@gmail.com', 'VIDEO_VOICE', 'ALL_STUDENTS', 'ACTIVE', '2026-10-09 18:34:14', '2026-10-09 18:34:14', 'https://meet.google.com/abc-defg-hij', '2026-10-09 18:34:14')
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- 14. Quiz Sessions Table
CREATE TABLE IF NOT EXISTS `quiz_sessions` (
  `id` VARCHAR(64) PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `pin` VARCHAR(32) NOT NULL,
  `target_type` VARCHAR(64) DEFAULT 'ALL',
  `duration_minutes` INT DEFAULT 15,
  `status` VARCHAR(64) DEFAULT 'ACTIVE',
  `created_by` VARCHAR(64),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `quiz_sessions` (`id`, `title`, `description`, `pin`, `target_type`, `duration_minutes`, `status`, `created_by`, `created_at`)
VALUES ('qs-1789326136526', 'AI Agent Architecture & Reasoning Sprint', 'Synchronized live quiz. Answer accurately and quickly for top leaderboard ranking.', '882201', 'ALL', 15, 'ACTIVE', 'adm-002', '2026-09-13 19:02:16')
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- 15. Student Progress Table
CREATE TABLE IF NOT EXISTS `student_progress` (
  `id` VARCHAR(64) PRIMARY KEY,
  `student_id` VARCHAR(64) UNIQUE NOT NULL,
  `materials_viewed_count` INT DEFAULT 0,
  `assessments_completed_count` INT DEFAULT 0,
  `avg_score` FLOAT DEFAULT 0,
  `attendance_pct` FLOAT DEFAULT 0,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `student_progress` (`id`, `student_id`, `materials_viewed_count`, `assessments_completed_count`, `avg_score`, `attendance_pct`, `updated_at`)
VALUES ('prog-001', 'std-001', 0, 0, 0, 100, '2026-09-05 10:24:27')
ON DUPLICATE KEY UPDATE `student_id` = VALUES(`student_id`);
INSERT INTO `student_progress` (`id`, `student_id`, `materials_viewed_count`, `assessments_completed_count`, `avg_score`, `attendance_pct`, `updated_at`)
VALUES ('prog-002', 'std-002', 0, 0, 0, 100, '2026-09-05 10:24:27')
ON DUPLICATE KEY UPDATE `student_id` = VALUES(`student_id`);
INSERT INTO `student_progress` (`id`, `student_id`, `materials_viewed_count`, `assessments_completed_count`, `avg_score`, `attendance_pct`, `updated_at`)
VALUES ('prog-003', 'std-003', 0, 0, 0, 100, '2026-09-05 10:24:27')
ON DUPLICATE KEY UPDATE `student_id` = VALUES(`student_id`);
INSERT INTO `student_progress` (`id`, `student_id`, `materials_viewed_count`, `assessments_completed_count`, `avg_score`, `attendance_pct`, `updated_at`)
VALUES ('prog-004', 'std-004', 0, 0, 0, 100, '2026-09-05 10:24:27')
ON DUPLICATE KEY UPDATE `student_id` = VALUES(`student_id`);
INSERT INTO `student_progress` (`id`, `student_id`, `materials_viewed_count`, `assessments_completed_count`, `avg_score`, `attendance_pct`, `updated_at`)
VALUES ('prog-005', 'std-005', 0, 0, 0, 100, '2026-09-05 10:24:27')
ON DUPLICATE KEY UPDATE `student_id` = VALUES(`student_id`);
INSERT INTO `student_progress` (`id`, `student_id`, `materials_viewed_count`, `assessments_completed_count`, `avg_score`, `attendance_pct`, `updated_at`)
VALUES ('prog-006', 'std-006', 0, 0, 0, 100, '2026-09-05 10:24:27')
ON DUPLICATE KEY UPDATE `student_id` = VALUES(`student_id`);
INSERT INTO `student_progress` (`id`, `student_id`, `materials_viewed_count`, `assessments_completed_count`, `avg_score`, `attendance_pct`, `updated_at`)
VALUES ('prog-007', 'std-007', 0, 0, 0, 100, '2026-09-05 10:24:27')
ON DUPLICATE KEY UPDATE `student_id` = VALUES(`student_id`);
INSERT INTO `student_progress` (`id`, `student_id`, `materials_viewed_count`, `assessments_completed_count`, `avg_score`, `attendance_pct`, `updated_at`)
VALUES ('prog-008', 'std-008', 0, 0, 0, 100, '2026-09-05 10:24:27')
ON DUPLICATE KEY UPDATE `student_id` = VALUES(`student_id`);
INSERT INTO `student_progress` (`id`, `student_id`, `materials_viewed_count`, `assessments_completed_count`, `avg_score`, `attendance_pct`, `updated_at`)
VALUES ('prog-009', 'std-009', 0, 0, 0, 100, '2026-09-05 10:24:27')
ON DUPLICATE KEY UPDATE `student_id` = VALUES(`student_id`);
INSERT INTO `student_progress` (`id`, `student_id`, `materials_viewed_count`, `assessments_completed_count`, `avg_score`, `attendance_pct`, `updated_at`)
VALUES ('prog-010', 'std-010', 0, 0, 0, 100, '2026-09-05 10:24:27')
ON DUPLICATE KEY UPDATE `student_id` = VALUES(`student_id`);
INSERT INTO `student_progress` (`id`, `student_id`, `materials_viewed_count`, `assessments_completed_count`, `avg_score`, `attendance_pct`, `updated_at`)
VALUES ('prog-011', 'std-011', 0, 0, 0, 100, '2026-09-05 10:24:27')
ON DUPLICATE KEY UPDATE `student_id` = VALUES(`student_id`);
INSERT INTO `student_progress` (`id`, `student_id`, `materials_viewed_count`, `assessments_completed_count`, `avg_score`, `attendance_pct`, `updated_at`)
VALUES ('prog-012', 'std-012', 0, 0, 0, 100, '2026-09-05 10:24:27')
ON DUPLICATE KEY UPDATE `student_id` = VALUES(`student_id`);
INSERT INTO `student_progress` (`id`, `student_id`, `materials_viewed_count`, `assessments_completed_count`, `avg_score`, `attendance_pct`, `updated_at`)
VALUES ('prog-013', 'std-013', 0, 0, 0, 100, '2026-09-05 10:24:27')
ON DUPLICATE KEY UPDATE `student_id` = VALUES(`student_id`);
INSERT INTO `student_progress` (`id`, `student_id`, `materials_viewed_count`, `assessments_completed_count`, `avg_score`, `attendance_pct`, `updated_at`)
VALUES ('prog-014', 'std-014', 0, 0, 0, 100, '2026-09-05 10:24:27')
ON DUPLICATE KEY UPDATE `student_id` = VALUES(`student_id`);
INSERT INTO `student_progress` (`id`, `student_id`, `materials_viewed_count`, `assessments_completed_count`, `avg_score`, `attendance_pct`, `updated_at`)
VALUES ('prog-015', 'std-015', 0, 0, 0, 100, '2026-09-05 10:24:27')
ON DUPLICATE KEY UPDATE `student_id` = VALUES(`student_id`);
INSERT INTO `student_progress` (`id`, `student_id`, `materials_viewed_count`, `assessments_completed_count`, `avg_score`, `attendance_pct`, `updated_at`)
VALUES ('prog-016', 'std-016', 0, 0, 0, 100, '2026-09-05 10:24:27')
ON DUPLICATE KEY UPDATE `student_id` = VALUES(`student_id`);
INSERT INTO `student_progress` (`id`, `student_id`, `materials_viewed_count`, `assessments_completed_count`, `avg_score`, `attendance_pct`, `updated_at`)
VALUES ('prog-017', 'std-017', 0, 0, 0, 100, '2026-09-05 10:24:27')
ON DUPLICATE KEY UPDATE `student_id` = VALUES(`student_id`);
INSERT INTO `student_progress` (`id`, `student_id`, `materials_viewed_count`, `assessments_completed_count`, `avg_score`, `attendance_pct`, `updated_at`)
VALUES ('prog-018', 'std-018', 0, 0, 0, 100, '2026-09-05 10:24:27')
ON DUPLICATE KEY UPDATE `student_id` = VALUES(`student_id`);
INSERT INTO `student_progress` (`id`, `student_id`, `materials_viewed_count`, `assessments_completed_count`, `avg_score`, `attendance_pct`, `updated_at`)
VALUES ('prog-019', 'std-019', 0, 0, 0, 100, '2026-09-05 10:24:27')
ON DUPLICATE KEY UPDATE `student_id` = VALUES(`student_id`);
INSERT INTO `student_progress` (`id`, `student_id`, `materials_viewed_count`, `assessments_completed_count`, `avg_score`, `attendance_pct`, `updated_at`)
VALUES ('prog-020', 'std-020', 0, 0, 0, 100, '2026-09-05 10:24:27')
ON DUPLICATE KEY UPDATE `student_id` = VALUES(`student_id`);
INSERT INTO `student_progress` (`id`, `student_id`, `materials_viewed_count`, `assessments_completed_count`, `avg_score`, `attendance_pct`, `updated_at`)
VALUES ('prog-021', 'std-021', 0, 0, 0, 100, '2026-09-05 10:24:27')
ON DUPLICATE KEY UPDATE `student_id` = VALUES(`student_id`);
INSERT INTO `student_progress` (`id`, `student_id`, `materials_viewed_count`, `assessments_completed_count`, `avg_score`, `attendance_pct`, `updated_at`)
VALUES ('prog-022', 'std-022', 0, 0, 0, 100, '2026-09-05 10:24:27')
ON DUPLICATE KEY UPDATE `student_id` = VALUES(`student_id`);
INSERT INTO `student_progress` (`id`, `student_id`, `materials_viewed_count`, `assessments_completed_count`, `avg_score`, `attendance_pct`, `updated_at`)
VALUES ('prog-023', 'std-023', 0, 0, 0, 100, '2026-09-05 10:24:27')
ON DUPLICATE KEY UPDATE `student_id` = VALUES(`student_id`);
INSERT INTO `student_progress` (`id`, `student_id`, `materials_viewed_count`, `assessments_completed_count`, `avg_score`, `attendance_pct`, `updated_at`)
VALUES ('prog-024', 'std-024', 0, 0, 0, 100, '2026-09-05 10:24:27')
ON DUPLICATE KEY UPDATE `student_id` = VALUES(`student_id`);
INSERT INTO `student_progress` (`id`, `student_id`, `materials_viewed_count`, `assessments_completed_count`, `avg_score`, `attendance_pct`, `updated_at`)
VALUES ('prog-025', 'std-025', 0, 0, 0, 100, '2026-09-05 10:24:27')
ON DUPLICATE KEY UPDATE `student_id` = VALUES(`student_id`);

-- 16. Audit Logs Table
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` VARCHAR(64) PRIMARY KEY,
  `actor_id` VARCHAR(64) NOT NULL,
  `actor_role` VARCHAR(64) NOT NULL,
  `action` VARCHAR(255) NOT NULL,
  `entity_type` VARCHAR(255) NOT NULL,
  `entity_id` VARCHAR(255),
  `metadata` TEXT,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1791734196793-148', 'adm-002', 'ADMIN', 'UPDATE_GD_CAPACITY', 'GD_SESSION', 'gd-demo-101', '"{\\"max_participants\\":10,\\"speaker_duration_limit_seconds\\":120}"', '2026-10-11 15:56:36')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1791734196783-46', 'adm-002', 'ADMIN', 'LOGIN', 'USER', 'adm-002', NULL, '2026-10-11 15:56:36')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1791734185321-21', 'adm-002', 'ADMIN', 'UPDATE_GD_CAPACITY', 'GD_SESSION', 'gd-demo-101', '"{\\"max_participants\\":25,\\"speaker_duration_limit_seconds\\":180}"', '2026-10-11 15:56:25')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1791734185307-597', 'adm-002', 'ADMIN', 'LOGIN', 'USER', 'adm-002', NULL, '2026-10-11 15:56:25')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1791733129965-548', 'adm-002', 'ADMIN', 'LOGIN', 'USER', 'adm-002', NULL, '2026-10-11 15:38:49')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1791733121702-357', 'std-003', 'STUDENT', 'LOGIN', 'USER', 'std-003', NULL, '2026-10-11 15:38:41')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1791733121683-530', 'std-002', 'STUDENT', 'LOGIN', 'USER', 'std-002', NULL, '2026-10-11 15:38:41')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1791733119563-658', 'std-001', 'STUDENT', 'LOGIN', 'USER', 'std-001', NULL, '2026-10-11 15:38:39')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1791733119528-481', 'adm-002', 'ADMIN', 'LOGIN', 'USER', 'adm-002', NULL, '2026-10-11 15:38:39')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1791732951681-576', 'std-003', 'STUDENT', 'LOGIN', 'USER', 'std-003', NULL, '2026-10-11 15:35:51')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1791732951671-77', 'std-002', 'STUDENT', 'LOGIN', 'USER', 'std-002', NULL, '2026-10-11 15:35:51')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1791732949628-92', 'std-001', 'STUDENT', 'LOGIN', 'USER', 'std-001', NULL, '2026-10-11 15:35:49')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1791732949622-692', 'adm-002', 'ADMIN', 'LOGIN', 'USER', 'adm-002', NULL, '2026-10-11 15:35:49')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1791732855410-542', 'std-001', 'STUDENT', 'LOGIN', 'USER', 'std-001', NULL, '2026-10-11 15:34:15')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1791732855404-565', 'adm-002', 'ADMIN', 'LOGIN', 'USER', 'adm-002', NULL, '2026-10-11 15:34:15')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1791573860281-514', 'std-001', 'STUDENT', 'LOGIN', 'USER', 'std-001', NULL, '2026-10-09 19:24:20')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1791573702492-195', 'std-001', 'STUDENT', 'LOGIN', 'USER', 'std-001', NULL, '2026-10-09 19:21:42')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1791573609677-943', 'std-001', 'STUDENT', 'LOGIN', 'USER', 'std-001', NULL, '2026-10-09 19:20:09')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1791573534029-961', 'std-001', 'STUDENT', 'LOGIN', 'USER', 'std-001', NULL, '2026-10-09 19:18:54')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1791573484333-636', 'adm-002', 'ADMIN', 'LOGIN', 'USER', 'adm-002', NULL, '2026-10-09 19:18:04')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1791571812093-409', 'adm-002', 'ADMIN', 'LOGIN', 'USER', 'adm-002', NULL, '2026-10-09 18:50:12')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1789326302286-464', 'std-001', 'STUDENT', 'LOGIN', 'USER', 'std-001', NULL, '2026-09-13 19:05:02')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1789326136532-488', 'std-001', 'STUDENT', 'LOGIN', 'USER', 'std-001', NULL, '2026-09-13 19:02:16')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1789326136527-28', 'adm-002', 'ADMIN', 'CREATE_QUIZ_SESSION', 'QUIZ_SESSION', 'qs-1789326136526', '"{\\"title\\":\\"AI Agent Architecture & Reasoning Sprint\\",\\"pin\\":\\"882201\\"}"', '2026-09-13 19:02:16')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1789326136513-863', 'adm-002', 'ADMIN', 'LOGIN', 'USER', 'adm-002', NULL, '2026-09-13 19:02:16')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1789325376448-583', 'adm-002', 'ADMIN', 'LOGIN', 'USER', 'adm-002', NULL, '2026-09-13 18:49:36')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1789325343340-714', 'adm-002', 'ADMIN', 'CREATE_MATERIAL', 'MATERIAL', 'mat-1789325343336', '"{\\"title\\":\\"Official LangGraph & AutoGen Documentation\\"}"', '2026-09-13 18:49:03')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1789325343321-141', 'adm-002', 'ADMIN', 'CREATE_MATERIAL', 'MATERIAL', 'mat-1789325343319', '"{\\"title\\":\\"Advanced Agentic Workflows & Multi-Agent Systems\\"}"', '2026-09-13 18:49:03')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1789325343275-864', 'adm-002', 'ADMIN', 'LOGIN', 'USER', 'adm-002', NULL, '2026-09-13 18:49:03')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1789325182349-453', 'adm-002', 'ADMIN', 'LOGIN', 'USER', 'adm-002', NULL, '2026-09-13 18:46:22')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1789325178204-258', 'adm-002', 'ADMIN', 'CREATE_MATERIAL', 'MATERIAL', 'mat-1789325178203', '"{\\"title\\":\\"Test PDF Upload\\"}"', '2026-09-13 18:46:18')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1789325178185-297', 'adm-002', 'ADMIN', 'LOGIN', 'USER', 'adm-002', NULL, '2026-09-13 18:46:18')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1789034265075-108', 'adm-002', 'ADMIN', 'DELETE_STUDENT', 'STUDENT', 'std-1789034264986-869', '"{\\"name\\":\\"Test Deletable\\",\\"email\\":\\"deletable@bitsathy.ac.in\\",\\"student_id\\":\\"7376TEST999\\"}"', '2026-09-10 09:57:45')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1789034264991-387', 'adm-002', 'ADMIN', 'CREATE_STUDENT', 'STUDENT', 'std-1789034264986-869', '"{\\"name\\":\\"Test Deletable\\"}"', '2026-09-10 09:57:44')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1789031327268-896', 'adm-002', 'ADMIN', 'RESTORE_DATABASE', 'SYSTEM', 'DATABASE', '"{\\"timestamp\\":\\"2026-09-10T09:08:47.268Z\\"}"', '2026-09-10 09:08:47')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1789031319961-200', 'adm-002', 'ADMIN', 'RESTORE_DATABASE', 'SYSTEM', 'DATABASE', '"{\\"timestamp\\":\\"2026-09-10T09:08:39.961Z\\"}"', '2026-09-10 09:08:39')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1789031296594-443', 'adm-002', 'ADMIN', 'LOGIN', 'USER', 'adm-002', NULL, '2026-09-10 09:08:16')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1788676594977-763', 'adm-002', 'ADMIN', 'LOGIN', 'USER', 'adm-002', NULL, '2026-09-06 06:36:34')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1788631239781-372', 'std-001', 'STUDENT', 'LOGIN', 'USER', 'std-001', NULL, '2026-09-05 18:00:39')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1788631236618-751', 'std-001', 'STUDENT', 'LOGIN', 'USER', 'std-001', NULL, '2026-09-05 18:00:36')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1788631200026-177', 'adm-002', 'ADMIN', 'LOGIN', 'USER', 'adm-002', NULL, '2026-09-05 18:00:00')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1788631195637-335', 'adm-002', 'ADMIN', 'LOGIN', 'USER', 'adm-002', NULL, '2026-09-05 17:59:55')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1788628054063-42', 'adm-002', 'ADMIN', 'LOGIN', 'USER', 'adm-002', NULL, '2026-09-05 17:07:34')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1788626953698-222', 'adm-1788626901288', 'ADMIN', 'LOGIN', 'USER', 'adm-1788626901288', NULL, '2026-09-05 16:49:13')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1788626901290-999', 'adm-002', 'ADMIN', 'CREATE_ADMIN', 'ADMIN_USER', 'adm-1788626901288', '"{\\"email\\":\\"yamunaranir.al25@bitsathy.ac.in\\",\\"name\\":\\"YAMUNA RANI R\\"}"', '2026-09-05 16:48:21')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1788626838852-291', 'adm-002', 'ADMIN', 'DELETE_ADMIN', 'ADMIN_USER', 'adm-001', '"{\\"email\\":\\"admin@college.edu\\"}"', '2026-09-05 16:47:18')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1788626820101-323', 'adm-002', 'ADMIN', 'LOGIN', 'USER', 'adm-002', NULL, '2026-09-05 16:47:00')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1788604731023-825', 'adm-002', 'ADMIN', 'DELETE_MATERIAL', 'MATERIAL', 'mat-003', NULL, '2026-09-05 10:38:51')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1788604726293-302', 'adm-002', 'ADMIN', 'DELETE_MATERIAL', 'MATERIAL', 'mat-002', NULL, '2026-09-05 10:38:46')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1788604723589-883', 'adm-002', 'ADMIN', 'DELETE_MATERIAL', 'MATERIAL', 'mat-001', NULL, '2026-09-05 10:38:43')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1788604706431-82', 'adm-002', 'ADMIN', 'DELETE_QUESTION_POOL', 'QUESTION_POOL', 'pool-1788601517672', NULL, '2026-09-05 10:38:26')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1788604700714-289', 'adm-002', 'ADMIN', 'DELETE_ALL_QUESTIONS', 'QUESTION', NULL, NULL, '2026-09-05 10:38:20')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1788604507742-947', 'adm-002', 'ADMIN', 'DELETE_NOTIFICATION', 'NOTIFICATION', '73d4f482-2a11-4328-abf2-74c3920857bd', '"{\\"title\\":\\"New Assessment Available: Agentic AI Level 1\\"}"', '2026-09-05 10:35:07')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1788604504628-71', 'adm-002', 'ADMIN', 'DELETE_NOTIFICATION', 'NOTIFICATION', '6ba0575b-0188-498d-af85-68b98b56fe0c', '"{\\"title\\":\\"Welcome to Student Assessment Portal v2\\"}"', '2026-09-05 10:35:04')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1788604501736-546', 'adm-002', 'ADMIN', 'DELETE_NOTIFICATION', 'NOTIFICATION', 'notif-1788430527373', '"{\\"title\\":\\"knkmnmm\\"}"', '2026-09-05 10:35:01')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1788604041512-592', 'std-020', 'STUDENT', 'LOGIN', 'USER', 'std-020', NULL, '2026-09-05 10:27:21')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`)
VALUES ('audit-1788604018689-834', 'adm-002', 'ADMIN', 'DELETE_ASSESSMENT', 'ASSESSMENT', 'ass-1788601618038', NULL, '2026-09-05 10:26:58')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);

SET FOREIGN_KEY_CHECKS = 1;
