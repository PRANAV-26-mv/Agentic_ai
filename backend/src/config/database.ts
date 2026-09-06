import fs from 'fs';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'database/portal.json');

// Ensure database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

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
  doubt_messages: []
};

class MemoryDb {
  private data: DbData;
  private syncTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.data = this.load();
    this.initCloudSync();
  }

  private load(): DbData {
    if (fs.existsSync(dbPath)) {
      try {
        const raw = fs.readFileSync(dbPath, 'utf-8');
        return { ...initialData, ...JSON.parse(raw) };
      } catch (err) {
        console.error('Error reading JSON DB, initializing fresh data:', err);
      }
    }
    return { ...initialData };
  }

  public save() {
    fs.writeFileSync(dbPath, JSON.stringify(this.data, null, 2), 'utf-8');
    this.triggerCloudSync();
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

  private async initCloudSync() {
    const syncUrl = process.env.DATABASE_SYNC_URL || process.env.JSONBIN_URL;
    const syncKey = process.env.DATABASE_SYNC_KEY || process.env.JSONBIN_SECRET_KEY;

    if (!syncUrl) return;

    try {
      console.log('Fetching persistent database state from Cloud Storage:', syncUrl);
      const headers: Record<string, string> = {};
      if (syncKey) headers['X-Access-Key'] = syncKey;

      const res = await fetch(syncUrl, { headers });
      if (res.ok) {
        const cloudData = await res.json();
        const payload = cloudData.record || cloudData;
        if (payload && typeof payload === 'object' && Array.isArray(payload.students)) {
          this.data = { ...initialData, ...payload };
          fs.writeFileSync(dbPath, JSON.stringify(this.data, null, 2), 'utf-8');
          console.log('Database successfully hydrated from Cloud Storage!');
        }
      }
    } catch (err: any) {
      console.error('Cloud Sync pull failed, using local portal.json:', err.message);
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
  getData: () => memoryDb.getData(),
  getTable: <K extends keyof DbData>(tableName: K) => memoryDb.table(tableName),
  transaction: (fn: () => void) => memoryDb.transaction(fn),
  restore: (newData: Partial<DbData>) => memoryDb.restoreFromData(newData),
};

export function initDatabase() {
  memoryDb.save();
  console.log('Database initialized successfully at:', dbPath);
}
