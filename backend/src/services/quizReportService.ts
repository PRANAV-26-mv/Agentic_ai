import PDFDocument from 'pdfkit';
import { 
  QuizSessionsModel, 
  QuizSessionParticipantsModel, 
  QuestionsModel, 
  isQuestionAnswerCorrect 
} from '../models/dbModels.js';

export function generateQuizSessionReportPDF(sessionId: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const session = QuizSessionsModel.findById(sessionId);
      if (!session) {
        return reject(new Error('Quiz session not found'));
      }

      const participants = QuizSessionParticipantsModel.getParticipants(sessionId);
      const leaderboard = QuizSessionParticipantsModel.getLeaderboard(sessionId);
      const questions = session.question_ids
        .map(id => QuestionsModel.findById(id))
        .filter((q): q is NonNullable<typeof q> => Boolean(q));

      const submitted = participants.filter(p => p.status === 'SUBMITTED');

      // Metric calculations
      const totalQuestions = questions.length;
      const totalMaxMarks = questions.reduce((sum, q) => sum + (typeof q.marks === 'number' && q.marks > 0 ? q.marks : 1), 0);
      const scores = submitted.map(p => p.score ?? 0);
      const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '0';
      const avgPercentage = totalMaxMarks > 0 ? Math.round((Number(avgScore) / totalMaxMarks) * 100) : 0;
      const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
      const winner = leaderboard[0];
      const passedCount = submitted.filter(p => (p.percentage ?? 0) >= 60).length;
      const passRate = submitted.length > 0 ? Math.round((passedCount / submitted.length) * 100) : 0;
      const totalTabSwitches = participants.reduce((sum, p) => sum + (p.tab_switches_count || 0), 0);

      // Initialize PDF
      const doc = new PDFDocument({ margin: 36, size: 'A4', bufferPages: true });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', err => reject(err));

      const primaryColor = '#4338ca'; // Indigo
      const secondaryColor = '#0f172a'; // Slate 900
      const accentGreen = '#059669'; // Emerald
      const accentAmber = '#d97706'; // Amber

      // HEADER
      doc.fillColor(primaryColor).fontSize(16).text('STUDENT ASSESSMENT & LEARNING PORTAL', { align: 'center' }).moveDown(0.2);
      doc.fillColor('#64748b').fontSize(10).text('OFFICIAL QUIZ SESSION PERFORMANCE & PROCTORING AUDIT REPORT', { align: 'center' }).moveDown(0.6);

      // Divider Line
      doc.moveTo(36, doc.y).lineTo(559, doc.y).strokeColor('#e2e8f0').lineWidth(1).stroke().moveDown(0.8);

      // QUIZ METADATA BLOCK
      const metaY = doc.y;
      doc.roundedRect(36, metaY, 523, 58, 6).fillColor('#f8fafc').fillAndStroke('#cbd5e1');

      doc.fillColor(secondaryColor).fontSize(13).text(session.title, 48, metaY + 10, { width: 340 });
      doc.fillColor('#64748b').fontSize(8.5);
      doc.text(`PIN: `, 48, metaY + 28, { continued: true })
         .fillColor(accentAmber).font('Helvetica-Bold').text(session.pin || 'N/A', { continued: true })
         .fillColor('#64748b').font('Helvetica').text(`  |  Target: ${session.target_type} ${session.target_department || session.target_community || 'General'}  |  Duration: ${session.duration_minutes} Mins`);
      doc.text(`Generated: ${new Date().toLocaleString()}  |  Status: ${session.status}`, 48, metaY + 40);

      // Session Status Pill
      doc.roundedRect(420, metaY + 12, 125, 34, 4).fillColor(session.status === 'COMPLETED' ? '#ecfdf5' : '#e0e7ff').fillAndStroke(session.status === 'COMPLETED' ? '#10b981' : '#6366f1');
      doc.fillColor(session.status === 'COMPLETED' ? '#065f46' : '#3730a3').fontSize(9).font('Helvetica-Bold')
         .text(session.status, 420, metaY + 18, { align: 'center', width: 125 });
      doc.fillColor('#475569').fontSize(7.5).font('Helvetica')
         .text(`${submitted.length} of ${participants.length} Finished`, 420, metaY + 30, { align: 'center', width: 125 });

      doc.y = metaY + 70;

      // KPI SUMMARY CARDS
      const kpiY = doc.y;
      const kpiW = 82;
      const kpiH = 46;
      const kpis = [
        { label: 'ATTENDEES', val: `${participants.length}`, sub: `${submitted.length} Submitted` },
        { label: 'TOTAL MARKS', val: `${totalMaxMarks}`, sub: `${totalQuestions} Questions` },
        { label: 'CLASS AVERAGE', val: `${avgScore}`, sub: `${avgPercentage}% Accuracy` },
        { label: 'HIGHEST SCORE', val: `${highestScore}/${totalMaxMarks}`, sub: winner ? winner.student_name.slice(0, 14) : 'N/A' },
        { label: 'PASS RATE', val: `${passRate}%`, sub: `${passedCount} Passed` },
        { label: 'SECURITY FLAGS', val: `${totalTabSwitches}`, sub: totalTabSwitches > 0 ? 'Tab Switches' : 'Clean Audit' }
      ];

      kpis.forEach((kpi, idx) => {
        const x = 36 + idx * (kpiW + 6.2);
        doc.roundedRect(x, kpiY, kpiW, kpiH, 4).fillColor('#ffffff').fillAndStroke('#e2e8f0');
        doc.fillColor('#64748b').fontSize(6.5).font('Helvetica-Bold').text(kpi.label, x + 2, kpiY + 6, { align: 'center', width: kpiW - 4 });
        doc.fillColor(secondaryColor).fontSize(11).font('Helvetica-Bold').text(kpi.val, x + 2, kpiY + 18, { align: 'center', width: kpiW - 4 });
        doc.fillColor('#94a3b8').fontSize(6.5).font('Helvetica').text(kpi.sub, x + 2, kpiY + 32, { align: 'center', width: kpiW - 4 });
      });

      doc.y = kpiY + 58;

      // SECTION: STUDENT LEADERBOARD & PERFORMANCE TABLE
      doc.fillColor(secondaryColor).fontSize(11).font('Helvetica-Bold').text('1. Student Performance & Proctoring Roster', 36, doc.y).moveDown(0.4);

      // Table Header
      const thY = doc.y;
      doc.roundedRect(36, thY, 523, 18, 3).fillColor('#1e1b4b').fill();
      doc.fillColor('#ffffff').fontSize(7.5).font('Helvetica-Bold');
      doc.text('Rank', 42, thY + 5);
      doc.text('Student Name', 72, thY + 5);
      doc.text('Reg ID', 190, thY + 5);
      doc.text('Dept', 255, thY + 5);
      doc.text('Score', 300, thY + 5);
      doc.text('Percentage', 350, thY + 5);
      doc.text('Time', 415, thY + 5);
      doc.text('Tab Switches', 460, thY + 5);
      doc.text('Status', 515, thY + 5);

      let rowY = thY + 20;

      if (leaderboard.length === 0) {
        doc.fillColor('#94a3b8').fontSize(8.5).font('Helvetica')
           .text('No submissions recorded yet for this session.', 36, rowY + 10, { align: 'center', width: 523 });
        rowY += 30;
      } else {
        leaderboard.forEach((entry, idx) => {
          if (rowY > 730) {
            doc.addPage();
            rowY = 40;
          }

          const isEven = idx % 2 === 0;
          if (isEven) {
            doc.rect(36, rowY - 2, 523, 16).fillColor('#f8fafc').fill();
          }

          const pRecord = participants.find(p => p.student_id === entry.student_id);
          const tabSwitches = pRecord?.tab_switches_count || 0;
          const mins = Math.floor(entry.time_taken_seconds / 60);
          const secs = entry.time_taken_seconds % 60;
          const timeStr = `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;

          // Rank icon / text
          doc.fillColor(entry.rank === 1 ? '#d97706' : entry.rank <= 3 ? '#2563eb' : '#334155').fontSize(7.5).font(entry.rank <= 3 ? 'Helvetica-Bold' : 'Helvetica');
          doc.text(`#${entry.rank}`, 42, rowY + 2);

          doc.fillColor(secondaryColor).font('Helvetica-Bold').text(entry.student_name.slice(0, 22), 72, rowY + 2);
          doc.fillColor('#64748b').font('Helvetica').text(entry.student_reg || 'N/A', 190, rowY + 2);
          doc.text(entry.student_department || 'GEN', 255, rowY + 2);

          doc.fillColor('#0f172a').font('Helvetica-Bold').text(`${entry.score} / ${entry.max_score}`, 300, rowY + 2);

          const pct = entry.percentage;
          doc.fillColor(pct >= 80 ? accentGreen : pct >= 60 ? '#2563eb' : '#dc2626')
             .font('Helvetica-Bold')
             .text(`${pct}%`, 350, rowY + 2);

          doc.fillColor('#475569').font('Helvetica').text(timeStr, 415, rowY + 2);

          // Tab switch warning color
          doc.fillColor(tabSwitches > 0 ? '#dc2626' : accentGreen)
             .font(tabSwitches > 0 ? 'Helvetica-Bold' : 'Helvetica')
             .text(`${tabSwitches} ${tabSwitches > 0 ? '⚠' : '✓'}`, 460, rowY + 2);

          doc.fillColor(accentGreen).fontSize(7).font('Helvetica-Bold').text('SUBMITTED', 515, rowY + 2);

          rowY += 16;
        });
      }

      // SECTION: QUESTION-BY-QUESTION AUDIT & ITEM ACCURACY
      if (rowY > 640) {
        doc.addPage();
        rowY = 40;
      } else {
        rowY += 15;
      }

      doc.fillColor(secondaryColor).fontSize(11).font('Helvetica-Bold').text('2. Question-by-Question Item Analysis', 36, rowY);
      rowY += 16;

      questions.forEach((q, qIdx) => {
        if (rowY > 720) {
          doc.addPage();
          rowY = 40;
        }

        // Count how many submitted students answered this question correctly
        let correctCount = 0;
        submitted.forEach(p => {
          if (p.answers_json) {
            try {
              const answers = JSON.parse(p.answers_json);
              const selected = answers[q.id];
              if (selected && isQuestionAnswerCorrect(q, selected)) {
                correctCount++;
              }
            } catch (e) {}
          }
        });

        const qAcc = submitted.length > 0 ? Math.round((correctCount / submitted.length) * 100) : 0;
        const qMarks = typeof q.marks === 'number' && q.marks > 0 ? q.marks : 1;

        doc.roundedRect(36, rowY, 523, 22, 3).fillColor('#f8fafc').fillAndStroke('#e2e8f0');
        doc.fillColor('#1e1b4b').fontSize(8).font('Helvetica-Bold').text(`Q${qIdx + 1}.`, 42, rowY + 6);
        doc.fillColor(secondaryColor).fontSize(7.5).font('Helvetica')
           .text(q.question_text.slice(0, 85) + (q.question_text.length > 85 ? '...' : ''), 62, rowY + 6, { width: 330 });

        doc.fillColor('#64748b').fontSize(7.5).font('Helvetica')
           .text(`Key: `, 400, rowY + 6, { continued: true })
           .fillColor(accentGreen).font('Helvetica-Bold').text(`Option ${q.correct_answer || 'A'}`, { continued: true })
           .fillColor('#64748b').font('Helvetica').text(`  (${qMarks} Mark${qMarks > 1 ? 's' : ''})`);

        doc.fillColor(qAcc >= 70 ? accentGreen : qAcc >= 40 ? accentAmber : '#dc2626')
           .fontSize(7.5).font('Helvetica-Bold')
           .text(`${qAcc}% Correct (${correctCount}/${submitted.length})`, 480, rowY + 6);

        rowY += 26;
      });

      // FOOTER ON ALL PAGES
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.moveTo(36, 792 - 36).lineTo(559, 792 - 36).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
        doc.fillColor('#94a3b8').fontSize(7).font('Helvetica')
           .text(`Portal Confidential Assessment Report  •  Session ID: ${session.id}`, 36, 792 - 28);
        doc.text(`Page ${i + 1} of ${range.count}`, 500, 792 - 28, { align: 'right' });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export function generateQuizSessionReportCSV(sessionId: string): string {
  const session = QuizSessionsModel.findById(sessionId);
  if (!session) throw new Error('Quiz session not found');

  const participants = QuizSessionParticipantsModel.getParticipants(sessionId);
  const leaderboard = QuizSessionParticipantsModel.getLeaderboard(sessionId);

  const headers = [
    'Rank',
    'Student Name',
    'Registration ID',
    'Department',
    'Community',
    'Score',
    'Max Marks',
    'Percentage (%)',
    'Time Taken (Seconds)',
    'Time Taken (Formatted)',
    'Proctoring Tab Switches',
    'Status',
    'Joined At',
    'Submitted At'
  ];

  // Map participants with ranking
  const rows = participants.map(p => {
    const lb = leaderboard.find(l => l.student_id === p.student_id);
    const rank = lb ? lb.rank : (p.rank || '-');
    const mins = p.time_taken_seconds ? Math.floor(p.time_taken_seconds / 60) : 0;
    const secs = p.time_taken_seconds ? p.time_taken_seconds % 60 : 0;
    const timeFormatted = p.time_taken_seconds ? `${mins}m ${secs}s` : 'N/A';

    return [
      rank,
      `"${(p.student_name || '').replace(/"/g, '""')}"`,
      `"${p.student_reg || ''}"`,
      `"${p.student_department || ''}"`,
      `"${(p.student_community || '').replace(/"/g, '""')}"`,
      p.score ?? 0,
      p.max_score ?? 0,
      p.percentage ?? 0,
      p.time_taken_seconds ?? 0,
      `"${timeFormatted}"`,
      p.tab_switches_count || 0,
      p.status,
      `"${p.joined_at || ''}"`,
      `"${p.submitted_at || ''}"`
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}
