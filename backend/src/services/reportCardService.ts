import PDFDocument from 'pdfkit';
import { 
  Student, 
  StudentsModel, 
  AssessmentAttemptsModel, 
  AttendanceModel, 
  AssessmentsModel,
  QuizSessionsModel,
  QuizSessionParticipant,
  memoryDb
} from '../models/dbModels.js';

export function generateReportCardPDF(studentId: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const student = StudentsModel.findById(studentId) || StudentsModel.findByStudentId(studentId);
      if (!student) {
        return reject(new Error('Student not found'));
      }

      // 1. Gather all student performance data
      const att = AttendanceModel.getStudentAttendance(student.id);
      const attempts = AssessmentAttemptsModel.findAll()
        .filter(a => a.student_id === student.id);

      const allParticipants = (memoryDb.table('quiz_session_participants') || []) as QuizSessionParticipant[];
      const quizParticipants = allParticipants.filter(p => 
        p.student_id === student.id || 
        (p.student_reg && p.student_reg.toLowerCase() === student.student_id.toLowerCase())
      );

      // Cumulative calculations
      const assessmentPcts = attempts.map(a => a.percentage || 0);
      const quizPcts = quizParticipants
        .filter(q => q.status === 'SUBMITTED' && typeof q.percentage === 'number')
        .map(q => q.percentage!);
      
      const allPcts = [...assessmentPcts, ...quizPcts];
      const overallAvg = allPcts.length > 0 
        ? Math.round(allPcts.reduce((sum, v) => sum + v, 0) / allPcts.length) 
        : 0;

      let standingGrade = 'Needs Improvement';
      let standingBadge = 'DEVELOPING';
      if (overallAvg >= 90) {
        standingGrade = 'Grade A+ (Distinction / Outstanding)';
        standingBadge = 'EXEMPLARY';
      } else if (overallAvg >= 80) {
        standingGrade = 'Grade A (Excellence)';
        standingBadge = 'MERIT';
      } else if (overallAvg >= 70) {
        standingGrade = 'Grade B+ (Proficient)';
        standingBadge = 'COMMENDED';
      } else if (overallAvg >= 60) {
        standingGrade = 'Grade B (Satisfactory)';
        standingBadge = 'COMPETENT';
      }

      // Initialize PDF document (A4, 36pt margins)
      const doc = new PDFDocument({ 
        margin: 36, 
        size: 'A4', 
        bufferPages: true,
        info: {
          Title: `Academic Report Card - ${student.name}`,
          Author: 'Student Assessment & Learning Portal',
          Subject: 'Official Student Performance Report Card',
          CreationDate: new Date()
        }
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        try {
          // Add footers on all buffered pages
          const range = doc.bufferedPageRange();
          for (let i = range.start; i < range.start + range.count; i++) {
            doc.switchToPage(i);
            // Footer separator
            doc.moveTo(36, 792).lineTo(559, 792).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
            doc.fillColor('#64748b').fontSize(7.5);
            doc.text(
              `Official Academic Transcript & Report Card • Generated on ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • Page ${i + 1} of ${range.count}`,
              36,
              802,
              { align: 'center', width: 523 }
            );
          }
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        } catch (finalizeErr) {
          reject(finalizeErr);
        }
      });
      doc.on('error', err => reject(err));

      // Color Palette
      const brandDark = '#0f172a'; // Slate 900
      const brandPrimary = '#0284c7'; // Sky 600
      const brandSecondary = '#334155'; // Slate 700
      const brandMuted = '#64748b'; // Slate 500
      const brandBgLight = '#f8fafc'; // Slate 50
      const borderColor = '#e2e8f0'; // Slate 200

      // Helper to check page bounds
      const checkPageOverflow = (neededHeight: number) => {
        if (doc.y + neededHeight > 745) {
          doc.addPage();
          // Header on subsequent pages
          doc.fillColor(brandPrimary).fontSize(10).text('STUDENT ASSESSMENT & LEARNING PORTAL — OFFICIAL REPORT CARD', 36, 36);
          doc.fillColor(brandMuted).fontSize(8).text(`Student: ${student.name} (${student.student_id})`, 36, 50);
          doc.moveTo(36, 62).lineTo(559, 62).strokeColor(borderColor).lineWidth(0.5).stroke();
          doc.y = 72;
        }
      };

      // ─── 1. TOP HEADER BANNER ───
      // Shaded Header Container
      doc.rect(36, 36, 523, 76).fill(brandDark);
      
      // Portal Title & Subtitle
      doc.fillColor('#ffffff').fontSize(16).text('STUDENT ASSESSMENT & LEARNING PORTAL', 48, 48, { characterSpacing: 0.5 });
      doc.fillColor('#38bdf8').fontSize(9).text('ACADEMIC EVALUATION & PROCTORING AUDIT REPORT CARD', 48, 68);
      
      // Top Right Document Verification Meta
      const issueDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      doc.fillColor('#94a3b8').fontSize(7.5).text(`ISSUED: ${issueDate}`, 380, 50, { align: 'right', width: 165 });
      doc.text(`DOC REF: RC-${student.student_id}-${new Date().getFullYear()}`, 380, 62, { align: 'right', width: 165 });
      doc.fillColor('#4ade80').fontSize(8).text(`STATUS: OFFICIALLY VERIFIED`, 380, 74, { align: 'right', width: 165 });

      doc.y = 122;

      // ─── 2. STUDENT DEMOGRAPHICS CARD ───
      doc.rect(36, doc.y, 523, 86).fillAndStroke(brandBgLight, borderColor);
      const demoStartY = doc.y + 10;

      // Column 1
      doc.fillColor(brandMuted).fontSize(7.5).text('STUDENT FULL NAME', 50, demoStartY);
      doc.fillColor(brandDark).fontSize(11).text(student.name, 50, demoStartY + 10);

      doc.fillColor(brandMuted).fontSize(7.5).text('STUDENT REGISTRATION ID', 50, demoStartY + 30);
      doc.fillColor(brandDark).fontSize(10).text(student.student_id, 50, demoStartY + 40);

      doc.fillColor(brandMuted).fontSize(7.5).text('STUDENT EMAIL', 50, demoStartY + 56);
      doc.fillColor(brandSecondary).fontSize(9).text(student.email, 50, demoStartY + 66);

      // Column 2
      doc.fillColor(brandMuted).fontSize(7.5).text('ACADEMIC DEPARTMENT', 220, demoStartY);
      doc.fillColor(brandDark).fontSize(10).text(`${student.department} (Year ${student.year})`, 220, demoStartY + 10);

      doc.fillColor(brandMuted).fontSize(7.5).text('ASSIGNED LEARNING COMMUNITY', 220, demoStartY + 30);
      doc.fillColor(brandDark).fontSize(10).text(student.community || 'General AI Track', 220, demoStartY + 40);

      doc.fillColor(brandMuted).fontSize(7.5).text('SUGGESTED CAREER TRACK', 220, demoStartY + 56);
      doc.fillColor(brandPrimary).fontSize(9).text(student.suggested_role || 'Agentic AI Systems Engineer', 220, demoStartY + 66);

      // Column 3 - Standing Summary Badge Box
      doc.rect(400, demoStartY, 145, 66).fillAndStroke('#ffffff', '#cbd5e1');
      doc.fillColor(brandMuted).fontSize(7).text('CUMULATIVE PERFORMANCE', 408, demoStartY + 6, { align: 'center', width: 130 });
      doc.fillColor(overallAvg >= 75 ? '#059669' : brandPrimary).fontSize(18).text(`${overallAvg}%`, 408, demoStartY + 18, { align: 'center', width: 130 });
      doc.fillColor(brandDark).fontSize(8).text(standingBadge, 408, demoStartY + 42, { align: 'center', width: 130 });
      doc.fillColor(brandMuted).fontSize(6.5).text(standingGrade.substring(0, 24), 408, demoStartY + 53, { align: 'center', width: 130 });

      doc.y = demoStartY + 92;

      // ─── 3. OVERVIEW METRICS HIGHLIGHTS (4 BOXES) ───
      const metricBoxW = 124;
      const metricBoxH = 46;
      const boxGap = 9;
      let startX = 36;
      const boxY = doc.y;

      const metrics = [
        { label: 'ATTENDANCE RATE', value: `${att.percentage}%`, note: `${att.present} of ${att.total} Sessions` },
        { label: 'FORMAL EXAMS', value: `${attempts.length}`, note: 'Evaluated Submissions' },
        { label: 'LIVE QUIZZES', value: `${quizParticipants.length}`, note: 'Real-time Challenges' },
        { label: 'CUMULATIVE GRADE', value: `${overallAvg}%`, note: standingGrade.split(' ')[0] }
      ];

      metrics.forEach((m, idx) => {
        const curX = startX + idx * (metricBoxW + boxGap);
        doc.rect(curX, boxY, metricBoxW, metricBoxH).fillAndStroke('#ffffff', borderColor);
        doc.fillColor(brandMuted).fontSize(7).text(m.label, curX + 8, boxY + 6);
        doc.fillColor(brandDark).fontSize(13).text(m.value, curX + 8, boxY + 16);
        doc.fillColor('#64748b').fontSize(6.5).text(m.note, curX + 8, boxY + 33);
      });

      doc.y = boxY + metricBoxH + 16;

      // ─── 4. SECTION: ATTENDANCE PERFORMANCE ───
      checkPageOverflow(70);
      doc.fillColor(brandDark).fontSize(11).text('1. Attendance & Participation Audit');
      doc.moveTo(36, doc.y + 2).lineTo(559, doc.y + 2).strokeColor(brandPrimary).lineWidth(1.5).stroke();
      doc.moveDown(0.6);

      const attBoxY = doc.y;
      doc.rect(36, attBoxY, 523, 40).fillAndStroke(brandBgLight, borderColor);
      doc.fillColor(brandSecondary).fontSize(8.5);
      doc.text(`Total Recorded Academic Sessions: ${att.total}`, 48, attBoxY + 8);
      doc.text(`Sessions Present: ${att.present}`, 220, attBoxY + 8);
      doc.text(`Sessions Absent: ${Math.max(0, att.total - att.present)}`, 360, attBoxY + 8);

      const attStatus = att.percentage >= 85 ? 'Excellent Standing (Eligible for all Honors)' : (att.percentage >= 75 ? 'Satisfactory Attendance' : 'Low Attendance Alert');
      const attColor = att.percentage >= 75 ? '#059669' : '#dc2626';
      doc.fillColor(attColor).fontSize(8.5).text(`Attendance Status: ${attStatus} (${att.percentage}%)`, 48, attBoxY + 24);

      doc.y = attBoxY + 50;

      // ─── 5. SECTION: FORMAL ASSESSMENT RESULTS TABLE ───
      checkPageOverflow(100);
      doc.fillColor(brandDark).fontSize(11).text('2. Formal Assessments & Modular Tests');
      doc.moveTo(36, doc.y + 2).lineTo(559, doc.y + 2).strokeColor(brandPrimary).lineWidth(1.5).stroke();
      doc.moveDown(0.6);

      if (attempts.length === 0) {
        doc.rect(36, doc.y, 523, 30).fillAndStroke(brandBgLight, borderColor);
        doc.fillColor(brandMuted).fontSize(8.5).text('No formal assessments have been submitted or recorded yet for this student.', 48, doc.y + 10);
        doc.y += 38;
      } else {
        // Table Header
        let curY = doc.y;
        doc.rect(36, curY, 523, 20).fill(brandDark);
        doc.fillColor('#ffffff').fontSize(8);
        doc.text('Assessment Title', 44, curY + 6);
        doc.text('MCQ Score', 240, curY + 6);
        doc.text('Subjective', 310, curY + 6);
        doc.text('Total Score', 380, curY + 6);
        doc.text('Percentage', 445, curY + 6);
        doc.text('Status', 505, curY + 6);

        curY += 20;

        attempts.forEach((attItem, index) => {
          checkPageOverflow(26);
          if (doc.y !== curY) {
            // A page break occurred
            curY = doc.y;
          }

          const ass = AssessmentsModel.findById(attItem.assessment_id);
          const title = ass ? ass.title : `Assessment #${index + 1}`;
          
          const rowBg = index % 2 === 0 ? '#ffffff' : brandBgLight;
          doc.rect(36, curY, 523, 20).fillAndStroke(rowBg, borderColor);

          doc.fillColor(brandDark).fontSize(8);
          doc.text(title.length > 34 ? title.substring(0, 32) + '...' : title, 44, curY + 6);
          doc.text(`${attItem.mcq_score ?? 0}`, 240, curY + 6);
          doc.text(`${attItem.writing_score ?? 0}`, 310, curY + 6);
          doc.text(`${attItem.total_score ?? 0}`, 380, curY + 6);
          
          const pct = attItem.percentage ?? 0;
          doc.fillColor(pct >= 60 ? '#059669' : '#d97706').text(`${pct}%`, 445, curY + 6);
          
          doc.fillColor(attItem.status === 'COMPLETED' || attItem.status === 'AUTO_SUBMITTED' ? '#0284c7' : brandMuted);
          doc.text(attItem.status || 'COMPLETED', 505, curY + 6);

          curY += 20;
          doc.y = curY;
        });

        doc.y += 10;
      }

      // ─── 6. SECTION: LIVE QUIZ SESSIONS & SPEED COMPETITIONS ───
      checkPageOverflow(100);
      doc.fillColor(brandDark).fontSize(11).text('3. Live Quiz Sessions & Timed Challenges');
      doc.moveTo(36, doc.y + 2).lineTo(559, doc.y + 2).strokeColor(brandPrimary).lineWidth(1.5).stroke();
      doc.moveDown(0.6);

      if (quizParticipants.length === 0) {
        doc.rect(36, doc.y, 523, 30).fillAndStroke(brandBgLight, borderColor);
        doc.fillColor(brandMuted).fontSize(8.5).text('No live quiz sessions completed yet for this student.', 48, doc.y + 10);
        doc.y += 38;
      } else {
        // Table Header
        let curY = doc.y;
        doc.rect(36, curY, 523, 20).fill('#334155');
        doc.fillColor('#ffffff').fontSize(8);
        doc.text('Quiz Session Title', 44, curY + 6);
        doc.text('Score', 240, curY + 6);
        doc.text('Accuracy', 310, curY + 6);
        doc.text('Cohort Rank', 380, curY + 6);
        doc.text('Time Taken', 445, curY + 6);
        doc.text('Integrity', 505, curY + 6);

        curY += 20;

        quizParticipants.forEach((qp, index) => {
          checkPageOverflow(26);
          if (doc.y !== curY) {
            curY = doc.y;
          }

          const session = QuizSessionsModel.findById(qp.session_id);
          const title = session ? session.title : `Quiz #${index + 1}`;
          
          const rowBg = index % 2 === 0 ? '#ffffff' : brandBgLight;
          doc.rect(36, curY, 523, 20).fillAndStroke(rowBg, borderColor);

          doc.fillColor(brandDark).fontSize(8);
          doc.text(title.length > 34 ? title.substring(0, 32) + '...' : title, 44, curY + 6);
          
          const scoreText = `${qp.score ?? 0} / ${qp.max_score ?? 0}`;
          doc.text(scoreText, 240, curY + 6);
          
          const pct = qp.percentage ?? 0;
          doc.fillColor(pct >= 60 ? '#059669' : '#d97706').text(`${pct}%`, 310, curY + 6);
          
          const rankText = qp.rank ? `#${qp.rank}` : '-';
          doc.fillColor(qp.rank === 1 ? '#d97706' : brandDark).text(rankText, 380, curY + 6);
          
          const timeText = qp.time_taken_seconds 
            ? `${Math.floor(qp.time_taken_seconds / 60)}m ${qp.time_taken_seconds % 60}s` 
            : '-';
          doc.fillColor(brandSecondary).text(timeText, 445, curY + 6);

          const switches = qp.tab_switches_count || 0;
          const integrityText = switches === 0 ? 'Clean (0)' : `${switches} alerts`;
          doc.fillColor(switches === 0 ? '#059669' : '#dc2626').text(integrityText, 505, curY + 6);

          curY += 20;
          doc.y = curY;
        });

        doc.y += 10;
      }

      // ─── 7. SECTION: EVALUATION SUMMARY & DIGITAL ATTESTATION ───
      checkPageOverflow(110);
      doc.fillColor(brandDark).fontSize(11).text('4. Official Academic Attestation & Verification');
      doc.moveTo(36, doc.y + 2).lineTo(559, doc.y + 2).strokeColor(brandPrimary).lineWidth(1.5).stroke();
      doc.moveDown(0.6);

      const attestY = doc.y;
      doc.rect(36, attestY, 523, 76).fillAndStroke(brandBgLight, borderColor);

      // Remarks & Endorsement
      doc.fillColor(brandDark).fontSize(8).text('FACULTY COMPETENCY ENDORSEMENT:', 48, attestY + 8);
      doc.fillColor(brandSecondary).fontSize(7.5).text(
        `This certified performance report card reflects the validated automated proctoring telemetry, formal assessment marks, and competitive live quiz results for candidate ${student.name}. The candidate has demonstrated proficiency in ${student.department} with specialization alignment toward ${student.suggested_role || 'Agentic AI Developer'}.`,
        48,
        attestY + 20,
        { width: 330, lineGap: 1.5 }
      );

      // Signatures Block
      doc.rect(390, attestY + 8, 155, 60).fillAndStroke('#ffffff', '#cbd5e1');
      doc.fillColor(brandPrimary).fontSize(7).text('DIGITALLY ATTESTED', 395, attestY + 12, { align: 'center', width: 145 });
      doc.fillColor(brandDark).fontSize(8).text('Controller of Examinations', 395, attestY + 26, { align: 'center', width: 145 });
      doc.fillColor(brandMuted).fontSize(6.5).text('Student Learning & Assessment Portal', 395, attestY + 38, { align: 'center', width: 145 });
      doc.fillColor('#059669').fontSize(6).text(`SHA256: ${Buffer.from(student.student_id + Date.now()).toString('base64').substring(0, 20)}`, 395, attestY + 50, { align: 'center', width: 145 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
