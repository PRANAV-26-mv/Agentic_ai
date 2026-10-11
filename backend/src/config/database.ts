import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Pool } from 'pg';

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
  gd_speaker_ratings: []
};

export type StorageMode = 'postgres' | 'cloud_sync' | 'persistent_disk' | 'ephemeral_local';

class MemoryDb {
  private data: DbData;
  private syncTimer: NodeJS.Timeout | null = null;
  private pgSyncTimer: NodeJS.Timeout | null = null;
  private pgPool: Pool | null = null;
  private storageMode: StorageMode = 'ephemeral_local';
  private lastSavedAt: string = new Date().toISOString();
  private isHydrated: boolean = false;
  private postgresLastError: string | null = null;
  private postgresHost: string | null = null;

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

  public async init(): Promise<void> {
    if (this.isHydrated) return;

    // 1. Check PostgreSQL Database (DATABASE_URL)
    const databaseUrl = process.env.DATABASE_URL;
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
          const pool = new Pool({
            connectionString: databaseUrl,
            ssl: useSsl ? { rejectUnauthorized: false } : false,
            connectionTimeoutMillis: 7000
          });
          await pool.query('SELECT 1 as ping;');
          return pool;
        };

        // Render internal connections often require non-SSL or self-signed certs. External cloud databases require SSL.
        // We attempt the best mode first, and if it fails, try the alternative before falling back.
        let connectedPool: Pool | null = null;
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

            // Ensure any arrays that diskData had populated are preserved if pgData is empty or missing them
            const arrayKeys: (keyof DbData)[] = [
              'admins', 'students', 'assessments', 'questions', 'study_materials',
              'attendance_sessions', 'quiz_sessions', 'meetings', 'meeting_settings',
              'gd_sessions', 'gd_participants'
            ];

            for (const k of arrayKeys) {
              const diskArr = (diskData as any)[k];
              const pgArr = (pgData as any)[k];
              if (Array.isArray(diskArr) && diskArr.length > 0 && (!Array.isArray(pgArr) || pgArr.length === 0)) {
                (mergedData as any)[k] = diskArr;
              }
            }

            // Always ensure Super Admin is in admins
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
            console.log(`✅ Database successfully hydrated & merged from PostgreSQL (${this.data.students.length} students, ${this.data.admins.length} admins, ${this.data.gd_sessions?.length || 0} GD sessions)!`);
            this.saveLocalCopies();
            await this.syncToPostgres();
            return;
          }
        }

        // If table is empty, save current seed/local data into PostgreSQL
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

    // 2. Check Remote Cloud Sync (JSONBIN_URL / DATABASE_SYNC_URL)
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

            const arrayKeys: (keyof DbData)[] = [
              'admins', 'students', 'assessments', 'questions', 'study_materials',
              'attendance_sessions', 'quiz_sessions', 'meetings', 'meeting_settings',
              'gd_sessions', 'gd_participants'
            ];

            for (const k of arrayKeys) {
              const diskArr = (diskData as any)[k];
              const cArr = (payload as any)[k];
              if (Array.isArray(diskArr) && diskArr.length > 0 && (!Array.isArray(cArr) || cArr.length === 0)) {
                (mergedData as any)[k] = diskArr;
              }
            }

            this.data = mergedData;
            this.storageMode = 'cloud_sync';
            this.isHydrated = true;
            this.lastSavedAt = new Date().toISOString();
            console.log(`✅ Database successfully hydrated & merged from Cloud Storage (${this.data.students.length} students)!`);
            this.saveLocalCopies();
            return;
          }
        }
      } catch (err: any) {
        console.error('⚠️ Cloud Sync pull failed:', err.message);
      }
    }

    // 3. Persistent Disk
    if (process.env.DATA_DIR || fs.existsSync('/var/data')) {
      this.storageMode = 'persistent_disk';
      this.isHydrated = true;
      console.log('✅ Persistent Disk storage active at:', dbPath);
      return;
    }

    // 4. Fallback Ephemeral Local
    this.storageMode = 'ephemeral_local';
    this.isHydrated = true;
    console.log('⚠️ Active storage mode: Ephemeral Local (Render Free Tier). Changes will reset when instance spins down unless DATABASE_URL or JSONBIN_URL is configured.');
  }

  public saveLocalCopies() {
    try {
      dbPath = resolveActiveDbPath();
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(dbPath, JSON.stringify(this.data, null, 2), 'utf-8');

      // Also ensure mirror to both root and backend
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
  }

  public async flush(): Promise<void> {
    if (this.pgSyncTimer) {
      clearTimeout(this.pgSyncTimer);
      this.pgSyncTimer = null;
    }
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
      this.syncTimer = null;
    }
    this.saveLocalCopies();
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
      postgres_connected: this.storageMode === 'postgres',
      postgres_host: this.postgresHost,
      postgres_error: this.postgresLastError,
      is_render_internal: Boolean(this.postgresHost && this.postgresHost.startsWith('dpg-') && !this.postgresHost.includes('.')),
      has_database_url: Boolean(process.env.DATABASE_URL),
      has_cloud_sync: Boolean(process.env.DATABASE_SYNC_URL || process.env.JSONBIN_URL),
      has_persistent_disk: Boolean(process.env.DATA_DIR || fs.existsSync('/var/data')),
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
        restricted_emails: this.data.restricted_emails?.length || 0,
        email_logs: this.data.email_logs?.length || 0,
        gd_sessions: this.data.gd_sessions?.length || 0,
        gd_participants: this.data.gd_participants?.length || 0
      }
    };
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

