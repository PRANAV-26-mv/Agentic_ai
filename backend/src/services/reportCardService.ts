import PDFDocument from 'pdfkit';
import { Student, StudentsModel, AssessmentAttemptsModel, AttendanceModel, AssessmentsModel } from '../models/dbModels.js';

export function generateReportCardPDF(studentId: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const student = StudentsModel.findById(studentId);
    if (!student) {
      return reject(new Error('Student not found'));
    }

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const buffers: Buffer[] = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers);
      resolve(pdfBuffer);
    });

    // Header
    doc
      .fillColor('#0284c7')
      .fontSize(22)
      .text('STUDENT ASSESSMENT & LEARNING PORTAL', { align: 'center' })
      .moveDown(0.2);

    doc
      .fillColor('#475569')
      .fontSize(12)
      .text('Official Performance Report Card', { align: 'center' })
      .moveDown(1);

    // Decorative Line
    doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#cbd5e1').stroke().moveDown(1);

    // Student Information Table / Grid
    doc.fillColor('#0f172a').fontSize(14).text('1. Student Profile Overview').moveDown(0.5);

    doc.fontSize(10).fillColor('#334155');
    doc.text(`Student ID: ${student.student_id}`, 40);
    doc.text(`Full Name: ${student.name}`, 300, doc.y - 12);
    doc.text(`Email: ${student.email}`, 40);
    doc.text(`Department: ${student.department} (Year ${student.year})`, 300, doc.y - 12);
    doc.text(`Community: ${student.community}`, 40);
    doc.text(`Skill Level: ${student.skill_level}`, 300, doc.y - 12);
    doc.text(`Suggested Role: ${student.suggested_role || 'N/A'}`, 40);
    doc.moveDown(1.5);

    // Attendance Summary
    const att = AttendanceModel.getStudentAttendance(student.id);
    doc.fillColor('#0f172a').fontSize(14).text('2. Attendance Performance').moveDown(0.5);
    doc.fontSize(10).fillColor('#334155');
    doc.text(`Total Recorded Sessions: ${att.total}`);
    doc.text(`Present Sessions: ${att.present}`);
    doc.text(`Attendance Percentage: ${att.percentage}%`);
    doc.moveDown(1.5);

    // Assessment Performance
    doc.fillColor('#0f172a').fontSize(14).text('3. Assessment History & Scores').moveDown(0.5);

    const attempts = AssessmentAttemptsModel.findAll().filter(a => a.student_id === student.id);
    
    if (attempts.length === 0) {
      doc.fontSize(10).fillColor('#64748b').text('No assessments completed yet.').moveDown(1);
    } else {
      // Table Header
      let y = doc.y;
      doc.fillColor('#0284c7').fontSize(9);
      doc.text('Assessment Title', 40, y);
      doc.text('MCQ', 260, y);
      doc.text('Writing', 310, y);
      doc.text('Total Score', 370, y);
      doc.text('Percentage', 440, y);
      doc.text('Status', 500, y);

      doc.moveTo(40, y + 14).lineTo(555, y + 14).strokeColor('#0284c7').stroke();
      y += 20;

      attempts.forEach((att) => {
        const ass = AssessmentsModel.findById(att.assessment_id);
        const title = ass ? ass.title : 'Assessment';
        
        doc.fillColor('#1e293b').fontSize(9);
        doc.text(title.substring(0, 35), 40, y);
        doc.text(`${att.mcq_score}`, 260, y);
        doc.text(`${att.writing_score}`, 310, y);
        doc.text(`${att.total_score}`, 370, y);
        doc.text(`${att.percentage}%`, 440, y);
        doc.text(att.status, 500, y);
        y += 18;
      });
      doc.y = y + 10;
    }

    doc.moveDown(2);

    // Footer
    doc
      .fillColor('#94a3b8')
      .fontSize(8)
      .text(`Generated on ${new Date().toLocaleDateString()} | Student Assessment & Learning Portal v2`, 40, 780, { align: 'center' });

    doc.end();
  });
}
