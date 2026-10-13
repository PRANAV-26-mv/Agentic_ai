import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Pool as PgPool } from 'pg';
import mysql, { Pool as MysqlPool } from 'mysql2/promise';

dotenv.config();

// Determine all possible locations for portal.json
function getCandidatePaths(): string[] {
  const list: string[] = [];

  // 1. Explicit environment variable (e.g. Render Persistent Disk: DATA_DIR=/var/data)
  if (process.env.DATA_DIR) {
    list.push(path.resolve(process.env.DATA_DIR, 'portal.json'));
  }

  // 2. Render standard persistent mount if present
  if (fs.existsSync('/var/data')) {
    list.push('/var/data/portal.json');
  }

  // 3. Current Working Directory database folder
  list.push(path.resolve(process.cwd(), 'database/portal.json'));

  // 4. Backend database folder
  list.push(path.resolve(process.cwd(), 'backend/database/portal.json'));

  // 5. Parent database folder (if running from dist/)
  list.push(path.resolve(__dirname, '../../database/portal.json'));
  list.push(path.resolve(__dirname, '../../../database/portal.json'));

  return list;
}

function resolveActiveDbPath(): string {
  const candidates = getCandidatePaths();
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  // If none exist yet, prioritize DATA_DIR, else root database/portal.json
  if (process.env.DATA_DIR) {
    const dir = path.resolve(process.env.DATA_DIR);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return path.resolve(dir, 'portal.json');
  }

  const defaultPath = path.resolve(process.cwd(), 'database/portal.json');
  const dir = path.dirname(defaultPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return defaultPath;
}

let dbPath = resolveActiveDbPath();

export interface DbData {
  admins: any[];
  students: any[];
  assessments: any[];
  assessment_assignments: any[];
  questions: any[];
  question_options: any[];
  question_pools: any[];
  question_pool_items: any[];
  assessment_questions: any[];
  assessment_attempts: any[];
  student_answers: any[];
  study_materials: any[];
  attendance_sessions: any[];
  attendance_records: any[];
  notifications: any[];
  notification_reads: any[];
  tab_switch_events: any[];
  student_progress: any[];
  audit_logs: any[];
  doubt_conversations: any[];
  doubt_messages: any[];
  quiz_sessions: any[];
  quiz_session_participants: any[];
  restricted_emails: any[];
  email_logs: any[];
  certificate_settings?: any[];
  meetings?: any[];
  meeting_participants?: any[];
  meeting_settings?: any[];
  gd_sessions: any[];
  gd_participants: any[];
  gd_peer_evaluations: any[];
  gd_speaker_ratings?: any[];
  prompt_sessions?: any[];
  prompt_submissions?: any[];
}

const initialData: DbData = {
  admins: [],
  students: [],
  assessments: [],
  assessment_assignments: [],
  questions: [],
  question_options: [],
  question_pools: [],
  question_pool_items: [],
  assessment_questions: [],
  assessment_attempts: [],
  student_answers: [],
  study_materials: [],
  attendance_sessions: [],
  attendance_records: [],
  notifications: [],
  notification_reads: [],
  tab_switch_events: [],
  student_progress: [],
  audit_logs: [],
  doubt_conversations: [],
  doubt_messages: [],
  quiz_sessions: [],
  quiz_session_participants: [],
  restricted_emails: [],
  email_logs: [],
  certificate_settings: [],
  meetings: [],
  meeting_participants: [],
  meeting_settings: [],
  gd_sessions: [],
  gd_participants: [],
  gd_peer_evaluations: [],
  gd_speaker_ratings: [],
  prompt_sessions: [],
  prompt_submissions: []
};

export type StorageMode = 'mysql' | 'postgres' | 'cloud_sync' | 'persistent_disk' | 'ephemeral_local';

class MemoryDb {
  private data: DbData;
  private syncTimer: NodeJS.Timeout | null = null;
  private pgSyncTimer: NodeJS.Timeout | null = null;
  private pgPool: PgPool | null = null;
  private mysqlPool: MysqlPool | null = null;
  private mysqlSyncTimer: NodeJS.Timeout | null = null;
  private storageMode: StorageMode = 'ephemeral_local';
  private lastSavedAt: string = new Date().toISOString();
  private isHydrated: boolean = false;
  private postgresLastError: string | null = null;
  private postgresHost: string | null = null;
  private mysqlLastError: string | null = null;
  private mysqlHost: string | null = null;

  constructor() {
    this.data = this.loadLocalFile();
  }

  private loadLocalFile(): DbData {
    dbPath = resolveActiveDbPath();
    if (fs.existsSync(dbPath)) {
      try {
        const raw = fs.readFileSync(dbPath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          console.log(`Loaded portal data from disk: ${dbPath}`);
          return { ...initialData, ...parsed };
        }
      } catch (err) {
        console.error('Error reading JSON DB from disk, initializing fresh:', err);
      }
    }
    return { ...initialData };
  }

  private async ensureMysqlTables(): Promise<void> {
    if (!this.mysqlPool) return;

    await this.mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS \`portal_storage\` (
        \`key\` VARCHAR(64) PRIMARY KEY,
        \`data\` LONGTEXT NOT NULL,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await this.mysqlPool.query(`
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
    `);

    await this.mysqlPool.query(`
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
    `);

    await this.mysqlPool.query(`
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
    `);

    await this.mysqlPool.query(`
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
    `);

    await this.mysqlPool.query(`
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
    `);

    await this.mysqlPool.query(`
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
    `);

    await this.mysqlPool.query(`
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
    `);
  }

  public async init(): Promise<void> {
    if (this.isHydrated) return;

    // 1. Check MySQL Database (Option 2 - Real-Time sync to MySQL Workbench)
    const useMysql = process.env.USE_MYSQL === 'true' || Boolean(process.env.MYSQL_URL) || Boolean(process.env.MYSQL_PASSWORD !== undefined && process.env.MYSQL_PASSWORD !== '');
    if (useMysql || process.env.MYSQL_HOST) {
      try {
        const mysqlHost = process.env.MYSQL_HOST || 'localhost';
        const mysqlPort = Number(process.env.MYSQL_PORT) || 3306;
        const mysqlUser = process.env.MYSQL_USER || 'root';
        const mysqlPassword = process.env.MYSQL_PASSWORD || '';
        const mysqlDatabase = process.env.MYSQL_DATABASE || 'student_portal';
        this.mysqlHost = mysqlHost;

        console.log(`🐬 Connecting to MySQL Database at ${mysqlHost}:${mysqlPort} (database: ${mysqlDatabase})...`);

        // Ensure database exists
        try {
          const rootConn = await mysql.createConnection({
            host: mysqlHost,
            port: mysqlPort,
            user: mysqlUser,
            password: mysqlPassword
          });
          await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${mysqlDatabase}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
          await rootConn.end();
        } catch (dbErr: any) {
          // May not have CREATE DATABASE permissions or already exists
        }

        const pool = mysql.createPool({
          host: mysqlHost,
          port: mysqlPort,
          user: mysqlUser,
          password: mysqlPassword,
          database: mysqlDatabase,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0
        });

        await pool.query('SELECT 1 as ping;');
        this.mysqlPool = pool;
        this.mysqlLastError = null;

        // Ensure schema and tables exist
        await this.ensureMysqlTables();

        // Hydrate from MySQL
        const [rows]: any = await this.mysqlPool.query(`
          SELECT \`data\`, \`updated_at\` FROM \`portal_storage\` WHERE \`key\` = 'portal_state' LIMIT 1;
        `);

        if (Array.isArray(rows) && rows.length > 0 && rows[0].data) {
          let parsedData: any = null;
          try {
            parsedData = typeof rows[0].data === 'string' ? JSON.parse(rows[0].data) : rows[0].data;
          } catch {
            console.warn('Could not parse MySQL portal_state JSON.');
          }

          if (parsedData && Array.isArray(parsedData.students) && parsedData.students.length > 0) {
            const diskData = this.loadLocalFile();
            const mergedData: DbData = { ...initialData, ...diskData, ...parsedData };

            const arrayKeys: (keyof DbData)[] = [
              'admins', 'students', 'assessments', 'questions', 'study_materials',
              'attendance_sessions', 'quiz_sessions', 'meetings', 'meeting_settings',
              'gd_sessions', 'gd_participants', 'prompt_sessions', 'prompt_submissions'
            ];

            for (const k of arrayKeys) {
              const diskArr = (diskData as any)[k];
              const myArr = (parsedData as any)[k];
              if (Array.isArray(diskArr) && diskArr.length > 0 && (!Array.isArray(myArr) || myArr.length === 0)) {
                (mergedData as any)[k] = diskArr;
              }
            }

            this.data = mergedData;
            this.storageMode = 'mysql';
            this.isHydrated = true;
            this.lastSavedAt = rows[0].updated_at ? new Date(rows[0].updated_at).toISOString() : new Date().toISOString();
            console.log(`✅ Database successfully hydrated from MySQL (${this.data.students.length} students, ${this.data.admins.length} admins, ${this.data.gd_sessions?.length || 0} GD sessions)!`);
            this.saveLocalCopies();
            await this.syncToMysql();
            return;
          }
        }

        // If MySQL has no state yet, seed it with current portal data
        this.storageMode = 'mysql';
        this.isHydrated = true;
        await this.syncToMysql();
        console.log('✅ MySQL connected & initial portal state stored.');
        return;
      } catch (err: any) {
        this.mysqlLastError = err.message;
        console.error('⚠️ MySQL connection failed, falling back:', err.message);
      }
    }

    // 2. Check PostgreSQL Database (DATABASE2_URL or DATABASE_URL)
    const databaseUrl = process.env.DATABASE2_URL || process.env.DATABASE_URL;
    if (databaseUrl) {
      try {
        let extractedHost = 'postgres';
        try {
          const parsed = new URL(databaseUrl.replace('postgresql://', 'http://').replace('postgres://', 'http://'));
          extractedHost = parsed.hostname;
        } catch {
          extractedHost = databaseUrl.split('@')[1]?.split('/')[0]?.split(':')[0] || 'postgres';
        }
        this.postgresHost = extractedHost;

        const isLocal = extractedHost === 'localhost' || extractedHost === '127.0.0.1';
        const isRenderInternal = extractedHost.startsWith('dpg-') && !extractedHost.includes('.');
        const isSslExplicitlyDisabled = databaseUrl.includes('sslmode=disable') || databaseUrl.includes('ssl=false');

        console.log(`Connecting to PostgreSQL Database at ${extractedHost} (Render internal: ${isRenderInternal})...`);

        const createAndTestPool = async (useSsl: boolean) => {
          const pool = new PgPool({
            connectionString: databaseUrl,
            ssl: useSsl ? { rejectUnauthorized: false } : false,
            connectionTimeoutMillis: 7000
          });
          await pool.query('SELECT 1 as ping;');
          return pool;
        };

        let connectedPool: PgPool | null = null;
        const initialSslAttempt = !isLocal && !isSslExplicitlyDisabled;

        try {
          connectedPool = await createAndTestPool(initialSslAttempt);
        } catch (firstErr: any) {
          console.warn(`PostgreSQL initial connection (SSL=${initialSslAttempt}) failed: ${firstErr.message}. Retrying alternate SSL mode...`);
          try {
            connectedPool = await createAndTestPool(!initialSslAttempt);
          } catch (secondErr: any) {
            this.postgresLastError = secondErr.message || firstErr.message;
            if (isRenderInternal && (secondErr.code === 'ENOTFOUND' || firstErr.code === 'ENOTFOUND')) {
              console.error('⚠️ Notice: The provided DATABASE_URL contains a Render Internal Hostname (dpg-...). Render internal hostnames only resolve within Render services hosted in the exact same region. For external connections or local development, use Render\'s External Database URL.');
            }
            throw secondErr;
          }
        }

        this.pgPool = connectedPool;
        this.postgresLastError = null;

        // Initialize table
        await this.pgPool.query(`
          CREATE TABLE IF NOT EXISTS portal_storage (
            key VARCHAR(64) PRIMARY KEY,
            data JSONB NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `);

        // Read stored state
        const res = await this.pgPool.query(`SELECT data, updated_at FROM portal_storage WHERE key = 'portal_state' LIMIT 1;`);
        if (res.rows.length > 0 && res.rows[0].data) {
          const pgData = res.rows[0].data;
          if (Array.isArray(pgData.students) && pgData.students.length > 0) {
            const diskData = this.loadLocalFile();
            const mergedData: DbData = { ...initialData, ...diskData, ...pgData };

            const arrayKeys: (keyof DbData)[] = [
              'admins', 'students', 'assessments', 'questions', 'study_materials',
              'attendance_sessions', 'quiz_sessions', 'meetings', 'meeting_settings',
              'gd_sessions', 'gd_participants', 'prompt_sessions', 'prompt_submissions'
            ];

            for (const k of arrayKeys) {
              const diskArr = (diskData as any)[k];
              const pgArr = (pgData as any)[k];
              if (Array.isArray(diskArr) && diskArr.length > 0 && (!Array.isArray(pgArr) || pgArr.length === 0)) {
                (mergedData as any)[k] = diskArr;
              }
            }

            if (diskData.admins && diskData.admins.length > 0) {
              for (const admin of diskData.admins) {
                if (!mergedData.admins.some((a: any) => a.email?.toLowerCase() === admin.email?.toLowerCase())) {
                  mergedData.admins.unshift(admin);
                }
              }
            }

            this.data = mergedData;
            this.storageMode = 'postgres';
            this.isHydrated = true;
            this.lastSavedAt = res.rows[0].updated_at || new Date().toISOString();
            console.log(`✅ Database successfully hydrated & merged from PostgreSQL (${this.data.students.length} students, ${this.data.admins.length} admins)!`);
            this.saveLocalCopies();
            await this.syncToPostgres();
            return;
          }
        }

        this.storageMode = 'postgres';
        this.isHydrated = true;
        await this.syncToPostgres();
        console.log('✅ PostgreSQL connected & initial portal state stored.');
        return;
      } catch (err: any) {
        this.postgresLastError = err.message;
        console.error('⚠️ PostgreSQL connection failed, falling back:', err.message);
      }
    }

    // 3. Check Remote Cloud Sync (JSONBIN_URL / DATABASE_SYNC_URL)
    const syncUrl = process.env.DATABASE_SYNC_URL || process.env.JSONBIN_URL;
    const syncKey = process.env.DATABASE_SYNC_KEY || process.env.JSONBIN_SECRET_KEY;

    if (syncUrl) {
      try {
        console.log('Fetching persistent database state from Cloud Storage:', syncUrl);
        const headers: Record<string, string> = {};
        if (syncKey) headers['X-Access-Key'] = syncKey;

        const res = await fetch(syncUrl, { headers });
        if (res.ok) {
          const cloudData = await res.json();
          const payload = cloudData.record || cloudData;
          if (payload && typeof payload === 'object' && Array.isArray(payload.students) && payload.students.length > 0) {
            const diskData = this.loadLocalFile();
            const mergedData: DbData = { ...initialData, ...diskData, ...payload };

            this.data = mergedData;
            this.storageMode = 'cloud_sync';
            this.isHydrated = true;
            this.lastSavedAt = new Date().toISOString();
            console.log(`✅ Database successfully hydrated from Cloud Storage (${this.data.students.length} students)!`);
            this.saveLocalCopies();
            return;
          }
        }
      } catch (err: any) {
        console.error('⚠️ Cloud Sync pull failed:', err.message);
      }
    }

    // 4. Persistent Disk
    if (process.env.DATA_DIR || fs.existsSync('/var/data')) {
      this.storageMode = 'persistent_disk';
      this.isHydrated = true;
      console.log('✅ Persistent Disk storage active at:', dbPath);
      return;
    }

    // 5. Fallback Ephemeral Local
    this.storageMode = 'ephemeral_local';
    this.isHydrated = true;
    console.log('⚠️ Active storage mode: Ephemeral Local.');
  }

  public saveLocalCopies() {
    try {
      dbPath = resolveActiveDbPath();
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(dbPath, JSON.stringify(this.data, null, 2), 'utf-8');

      const rootPath = path.resolve(process.cwd(), 'database/portal.json');
      const backendPath = path.resolve(process.cwd(), 'backend/database/portal.json');

      const rootDir = path.dirname(rootPath);
      if (!fs.existsSync(rootDir)) fs.mkdirSync(rootDir, { recursive: true });
      fs.writeFileSync(rootPath, JSON.stringify(this.data, null, 2), 'utf-8');

      const backendDir = path.dirname(backendPath);
      if (!fs.existsSync(backendDir)) fs.mkdirSync(backendDir, { recursive: true });
      fs.writeFileSync(backendPath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err: any) {
      console.error('Failed to write local portal.json copy:', err.message);
    }
  }

  public save() {
    this.lastSavedAt = new Date().toISOString();
    this.saveLocalCopies();
    this.triggerCloudSync();
    this.triggerPostgresSync();
    this.triggerMysqlSync();
  }

  public async flush(): Promise<void> {
    if (this.mysqlSyncTimer) {
      clearTimeout(this.mysqlSyncTimer);
      this.mysqlSyncTimer = null;
    }
    if (this.pgSyncTimer) {
      clearTimeout(this.pgSyncTimer);
      this.pgSyncTimer = null;
    }
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
      this.syncTimer = null;
    }
    this.saveLocalCopies();
    if (this.mysqlPool) {
      await this.syncToMysql();
    }
    if (this.pgPool) {
      await this.syncToPostgres();
    }
  }

  public restoreFromData(newData: Partial<DbData>) {
    this.data = { ...initialData, ...newData };
    this.save();
    console.log('Database successfully restored from backup payload.');
    return this.data;
  }

  public getData(): DbData {
    return this.data;
  }

  public table<K extends keyof DbData>(name: K): DbData[K] {
    if (!this.data[name]) {
      this.data[name] = [] as any;
    }
    return this.data[name];
  }

  public transaction(fn: () => void) {
    return () => {
      fn();
      this.save();
    };
  }

  public getStorageStatus() {
    return {
      mode: this.storageMode,
      is_ephemeral: this.storageMode === 'ephemeral_local',
      mysql_connected: this.storageMode === 'mysql',
      mysql_host: this.mysqlHost,
      mysql_error: this.mysqlLastError,
      postgres_connected: this.storageMode === 'postgres',
      postgres_host: this.postgresHost,
      postgres_error: this.postgresLastError,
      has_mysql: Boolean(process.env.USE_MYSQL === 'true' || process.env.MYSQL_PASSWORD),
      has_database_url: Boolean(process.env.DATABASE2_URL || process.env.DATABASE_URL),
      last_saved: this.lastSavedAt,
      db_path: dbPath,
      counts: {
        admins: this.data.admins?.length || 0,
        students: this.data.students?.length || 0,
        assessments: this.data.assessments?.length || 0,
        questions: this.data.questions?.length || 0,
        materials: this.data.study_materials?.length || 0,
        attempts: this.data.assessment_attempts?.length || 0,
        attendance_sessions: this.data.attendance_sessions?.length || 0,
        notifications: this.data.notifications?.length || 0,
        audit_logs: this.data.audit_logs?.length || 0,
        gd_sessions: this.data.gd_sessions?.length || 0,
        gd_participants: this.data.gd_participants?.length || 0
      }
    };
  }

  private triggerMysqlSync() {
    if (!this.mysqlPool) return;
    if (this.mysqlSyncTimer) clearTimeout(this.mysqlSyncTimer);
    this.mysqlSyncTimer = setTimeout(async () => {
      await this.syncToMysql();
    }, 250);
  }

  private async syncToMysql() {
    if (!this.mysqlPool) return;
    try {
      // 1. Save master state in portal_storage
      await this.mysqlPool.query(`
        INSERT INTO \`portal_storage\` (\`key\`, \`data\`, \`updated_at\`)
        VALUES ('portal_state', ?, NOW())
        ON DUPLICATE KEY UPDATE \`data\` = VALUES(\`data\`), \`updated_at\` = NOW();
      `, [JSON.stringify(this.data)]);

      // 2. Sync Admins relational table
      if (this.data.admins && this.data.admins.length > 0) {
        for (const a of this.data.admins) {
          await this.mysqlPool.query(`
            INSERT INTO \`admins\` (\`id\`, \`name\`, \`email\`, \`password\`, \`role\`, \`department\`, \`is_super_admin\`, \`created_at\`)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`), \`email\` = VALUES(\`email\`), \`password\` = VALUES(\`password\`), \`role\` = VALUES(\`role\`), \`department\` = VALUES(\`department\`);
          `, [a.id, a.name, a.email, a.password, a.role || 'ADMIN', a.department || '', a.is_super_admin ? 1 : 0, a.created_at ? new Date(a.created_at) : new Date()]);
        }
      }

      // 3. Sync Students relational table
      if (this.data.students && this.data.students.length > 0) {
        for (const s of this.data.students) {
          await this.mysqlPool.query(`
            INSERT INTO \`students\` (\`id\`, \`student_id\`, \`name\`, \`email\`, \`password\`, \`department\`, \`year\`, \`community\`, \`skill_level\`, \`profile\`, \`interest\`, \`suggested_role\`, \`status\`, \`created_at\`)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`), \`email\` = VALUES(\`email\`), \`password\` = VALUES(\`password\`), \`department\` = VALUES(\`department\`), \`year\` = VALUES(\`year\`), \`community\` = VALUES(\`community\`), \`status\` = VALUES(\`status\`);
          `, [s.id, s.student_id, s.name, s.email, s.password, s.department || '', Number(s.year) || 1, s.community || '', s.skill_level || 'Beginner', s.profile || '', s.interest || '', s.suggested_role || '', s.status || 'ACTIVE', s.created_at ? new Date(s.created_at) : new Date()]);
        }
      }

      // 4. Sync GD Sessions relational table
      if (this.data.gd_sessions && this.data.gd_sessions.length > 0) {
        for (const gd of this.data.gd_sessions) {
          await this.mysqlPool.query(`
            INSERT INTO \`gd_sessions\` (\`id\`, \`title\`, \`topic\`, \`description\`, \`pin\`, \`guidelines\`, \`target_community\`, \`department\`, \`date\`, \`start_time\`, \`duration_minutes\`, \`time_per_candidate_seconds\`, \`max_participants\`, \`min_evaluators_per_candidate\`, \`evaluation_criteria\`, \`speaker_duration_limit_seconds\`, \`status\`, \`created_by\`, \`created_at\`)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE \`title\` = VALUES(\`title\`), \`topic\` = VALUES(\`topic\`), \`status\` = VALUES(\`status\`), \`speaker_duration_limit_seconds\` = VALUES(\`speaker_duration_limit_seconds\`);
          `, [gd.id, gd.title, gd.topic, gd.description || null, gd.pin || null, gd.guidelines || null, gd.target_community || null, gd.department || null, gd.date || null, gd.start_time || null, Number(gd.duration_minutes) || 30, Number(gd.time_per_candidate_seconds) || 180, Number(gd.max_participants) || 10, Number(gd.min_evaluators_per_candidate) || 3, JSON.stringify(gd.evaluation_criteria || []), Number(gd.speaker_duration_limit_seconds) || 120, gd.status || 'UPCOMING', gd.created_by || null, gd.created_at ? new Date(gd.created_at) : new Date()]);
        }
      }

      // 5. Sync GD Participants relational table
      if (this.data.gd_participants && this.data.gd_participants.length > 0) {
        for (const gp of this.data.gd_participants) {
          await this.mysqlPool.query(`
            INSERT INTO \`gd_participants\` (\`id\`, \`session_id\`, \`student_id\`, \`student_name\`, \`student_reg\`, \`student_department\`, \`student_community\`, \`speaking_order\`, \`speaking_status\`, \`speaking_time_seconds\`, \`rank\` , \`total_points\`, \`joined_at\`)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE \`student_name\` = VALUES(\`student_name\`), \`speaking_status\` = VALUES(\`speaking_status\`), \`speaking_time_seconds\` = VALUES(\`speaking_time_seconds\`), \`rank\` = VALUES(\`rank\`), \`total_points\` = VALUES(\`total_points\`);
          `, [gp.id, gp.session_id, gp.student_id, gp.student_name, gp.student_reg, gp.student_department || null, gp.student_community || null, Number(gp.speaking_order) || 1, gp.speaking_status || 'PENDING', Number(gp.speaking_time_seconds) || 0, Number(gp.rank) || 0, Number(gp.total_points) || 0, gp.joined_at ? new Date(gp.joined_at) : new Date()]);
        }
      }

      // 6. Sync recent Audit Logs
      if (this.data.audit_logs && this.data.audit_logs.length > 0) {
        const recentLogs = this.data.audit_logs.slice(-30);
        for (const log of recentLogs) {
          await this.mysqlPool.query(`
            INSERT IGNORE INTO \`audit_logs\` (\`id\`, \`actor_id\`, \`actor_role\`, \`action\`, \`entity_type\`, \`entity_id\`, \`metadata\`, \`timestamp\`)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?);
          `, [log.id, log.actor_id, log.actor_role, log.action, log.entity_type, log.entity_id || null, log.metadata ? (typeof log.metadata === 'string' ? log.metadata : JSON.stringify(log.metadata)) : null, log.timestamp ? new Date(log.timestamp) : new Date()]);
        }
      }

      console.log('🐬 Database changes successfully saved to MySQL.');
    } catch (err: any) {
      console.error('MySQL save failed:', err.message);
    }
  }

  private triggerPostgresSync() {
    if (!this.pgPool) return;

    if (this.pgSyncTimer) clearTimeout(this.pgSyncTimer);

    this.pgSyncTimer = setTimeout(async () => {
      await this.syncToPostgres();
    }, 1000);
  }

  private async syncToPostgres() {
    if (!this.pgPool) return;
    try {
      await this.pgPool.query(`
        INSERT INTO portal_storage (key, data, updated_at)
        VALUES ('portal_state', $1, NOW())
        ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
      `, [JSON.stringify(this.data)]);
      console.log('Database changes successfully saved to PostgreSQL.');
    } catch (err: any) {
      console.error('PostgreSQL save failed:', err.message);
    }
  }

  private triggerCloudSync() {
    const syncUrl = process.env.DATABASE_SYNC_URL || process.env.JSONBIN_URL;
    const syncKey = process.env.DATABASE_SYNC_KEY || process.env.JSONBIN_SECRET_KEY;

    if (!syncUrl) return;

    if (this.syncTimer) clearTimeout(this.syncTimer);

    this.syncTimer = setTimeout(async () => {
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (syncKey) headers['X-Access-Key'] = syncKey;

        await fetch(syncUrl, {
          method: 'PUT',
          headers,
          body: JSON.stringify(this.data)
        });
        console.log('Database changes successfully synced to Cloud Storage.');
      } catch (err: any) {
        console.error('Cloud Sync push failed:', err.message);
      }
    }, 2000);
  }
}

export const memoryDb = new MemoryDb();

export const db = {
  save: () => memoryDb.save(),
  flush: () => memoryDb.flush(),
  getData: () => memoryDb.getData(),
  getTable: <K extends keyof DbData>(tableName: K) => memoryDb.table(tableName),
  transaction: (fn: () => void) => memoryDb.transaction(fn),
  restore: async (newData: Partial<DbData>) => {
    const res = memoryDb.restoreFromData(newData);
    await memoryDb.flush();
    return res;
  },
  getStorageStatus: () => memoryDb.getStorageStatus()
};

export async function initDatabase(): Promise<void> {
  await memoryDb.init();
  memoryDb.saveLocalCopies();
  console.log(`✅ Database initialized successfully. Mode: ${memoryDb.getStorageStatus().mode}, Path: ${dbPath}`);
}
