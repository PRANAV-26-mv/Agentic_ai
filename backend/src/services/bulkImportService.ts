import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import { StudentsModel, Student, AuditLogsModel } from '../models/dbModels.js';

export interface ImportRowResult {
  rowNumber: number;
  studentId: string;
  name: string;
  email: string;
  department: string;
  year: number;
  community: string;
  status: 'VALID' | 'ERROR';
  errorReason?: string;
}

export interface BulkImportResponse {
  totalRows: number;
  validCount: number;
  errorCount: number;
  canCommit: boolean;
  rows: ImportRowResult[];
  committedCount?: number;
}

export class BulkImportService {
  parseFileBuffer(buffer: Buffer, mimetype: string): any[] {
    if (mimetype === 'text/csv' || mimetype.includes('csv')) {
      const csvContent = buffer.toString('utf-8');
      return parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
    } else {
      // XLSX
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      return XLSX.utils.sheet_to_json(sheet);
    }
  }

  processImport(buffer: Buffer, mimetype: string, mode: 'dry-run' | 'commit', adminId: string): BulkImportResponse {
    const rawRows = this.parseFileBuffer(buffer, mimetype);
    const existingStudents = StudentsModel.findAll();

    const existingEmails = new Set(existingStudents.map(s => s.email.toLowerCase()));
    const existingStudentIds = new Set(existingStudents.map(s => s.student_id.toLowerCase()));

    const seenEmailsInFile = new Set<string>();
    const seenStudentIdsInFile = new Set<string>();

    const rowsResult: ImportRowResult[] = [];
    let validCount = 0;
    let errorCount = 0;

    const validStudentsToCreate: Omit<Student, 'id' | 'created_at' | 'status'>[] = [];

    rawRows.forEach((r, idx) => {
      const rowNum = idx + 1;
      const studentId = String(r['Student ID'] || r['student_id'] || r['StudentID'] || '').trim();
      const name = String(r['Name'] || r['name'] || r['Student Name'] || '').trim();
      const email = String(r['Email'] || r['email'] || r['College Email'] || '').trim();
      const department = String(r['Department'] || r['department'] || 'CS').trim();
      const year = parseInt(r['Year'] || r['year'] || '3', 10);
      const community = String(r['Community'] || r['community'] || 'Agentic AI & LLM Optimization').trim();
      const skillLevel = String(r['Skill Level'] || r['skill_level'] || 'Intermediate').trim();
      const profile = String(r['Profile'] || r['profile'] || '').trim();
      const interest = String(r['Interest'] || r['interest'] || '').trim();
      const suggestedRole = String(r['Suggested Role'] || r['suggested_role'] || 'AI Developer').trim();

      const errors: string[] = [];

      if (!studentId) errors.push('Missing Student ID');
      if (!name) errors.push('Missing Name');
      if (!email || !email.includes('@')) errors.push('Invalid Email');
      if (!department) errors.push('Missing Department');

      const lowerEmail = email.toLowerCase();
      const lowerStudentId = studentId.toLowerCase();

      // Check duplicates within file
      if (seenEmailsInFile.has(lowerEmail)) {
        errors.push(`Duplicate email '${email}' within file`);
      } else if (email) {
        seenEmailsInFile.add(lowerEmail);
      }

      if (seenStudentIdsInFile.has(lowerStudentId)) {
        errors.push(`Duplicate Student ID '${studentId}' within file`);
      } else if (studentId) {
        seenStudentIdsInFile.add(lowerStudentId);
      }

      // Check duplicates against DB
      if (existingEmails.has(lowerEmail)) {
        errors.push(`Email '${email}' already exists in database`);
      }
      if (existingStudentIds.has(lowerStudentId)) {
        errors.push(`Student ID '${studentId}' already exists in database`);
      }

      if (errors.length > 0) {
        errorCount++;
        rowsResult.push({
          rowNumber: rowNum,
          studentId,
          name,
          email,
          department,
          year,
          community,
          status: 'ERROR',
          errorReason: errors.join('; ')
        });
      } else {
        validCount++;
        rowsResult.push({
          rowNumber: rowNum,
          studentId,
          name,
          email,
          department,
          year,
          community,
          status: 'VALID'
        });

        validStudentsToCreate.push({
          student_id: studentId,
          name,
          email,
          department,
          year,
          community,
          skill_level: skillLevel,
          profile,
          interest,
          suggested_role: suggestedRole
        });
      }
    });

    const canCommit = errorCount === 0 && validCount > 0;

    let committedCount = 0;
    if (mode === 'commit' && canCommit) {
      for (const s of validStudentsToCreate) {
        StudentsModel.create(s);
        committedCount++;
      }

      AuditLogsModel.log(
        adminId,
        'ADMIN',
        'BULK_IMPORT_STUDENTS',
        'STUDENTS',
        undefined,
        { totalImported: committedCount }
      );
    }

    return {
      totalRows: rawRows.length,
      validCount,
      errorCount,
      canCommit,
      rows: rowsResult,
      committedCount: mode === 'commit' ? committedCount : undefined
    };
  }
}

export const bulkImportService = new BulkImportService();
