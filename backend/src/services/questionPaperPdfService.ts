import PDFDocument from 'pdfkit';
import { Question } from '../models/dbModels.js';

export interface QuestionPaperOptions {
  title?: string;
  subtitle?: string;
  institution?: string;
  duration_minutes?: number;
  total_marks?: number;
  instructions?: string[];
  include_answers?: boolean;
  watermark?: string;
}

export function generateQuestionPaperPDF(
  questions: Question[],
  options: QuestionPaperOptions = {}
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 40,
        size: 'A4',
        bufferPages: true,
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', (err) => {
        reject(err);
      });

      const institution = options.institution || 'STUDENT ASSESSMENT & LEARNING PORTAL';
      const title = options.title || 'AI GENERATED EXAMINATION QUESTION PAPER';
      const subtitle = options.subtitle || (questions[0]?.topic ? `Subject / Topic: ${questions[0].topic}` : 'Official Assessment Paper');
      const duration = options.duration_minutes || 60;
      const includeAnswers = options.include_answers ?? false;

      // Calculate total marks
      const calculatedTotalMarks = questions.reduce((sum, q) => sum + (Number(q.marks) || 1), 0);
      const totalMarks = options.total_marks || calculatedTotalMarks;

      // Header Banner
      doc
        .fillColor('#1e1b4b')
        .fontSize(16)
        .font('Helvetica-Bold')
        .text(institution.toUpperCase(), { align: 'center' })
        .moveDown(0.2);

      doc
        .fillColor('#4338ca')
        .fontSize(13)
        .font('Helvetica-Bold')
        .text(title.toUpperCase(), { align: 'center' })
        .moveDown(0.2);

      doc
        .fillColor('#475569')
        .fontSize(10)
        .font('Helvetica')
        .text(subtitle, { align: 'center' })
        .moveDown(0.6);

      // Meta Info Grid
      const startY = doc.y;
      doc
        .rect(40, startY, 515, 36)
        .fillAndStroke('#f8fafc', '#cbd5e1');

      doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold');
      doc.text(`Time Allowed: ${duration} Mins`, 50, startY + 8);
      doc.text(`Total Questions: ${questions.length}`, 220, startY + 8);
      doc.text(`Maximum Marks: ${totalMarks}`, 410, startY + 8);

      doc.font('Helvetica').fillColor('#64748b').fontSize(8);
      doc.text(`Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`, 50, startY + 22);
      doc.text('Evaluation: Admin Certified', 220, startY + 22);
      doc.text('Security: Admin Authorized', 410, startY + 22);

      doc.y = startY + 44;

      // Candidate Box
      const candY = doc.y;
      doc
        .rect(40, candY, 515, 30)
        .strokeColor('#e2e8f0')
        .stroke();

      doc.fillColor('#334155').fontSize(9).font('Helvetica');
      doc.text('Candidate Name: _________________________________', 50, candY + 10);
      doc.text('Roll No / Reg ID: ______________________', 330, candY + 10);

      doc.y = candY + 38;

      // Instructions
      const instructions = options.instructions && options.instructions.length > 0
        ? options.instructions
        : [
            '1. All questions are compulsory unless specified otherwise.',
            '2. Section A contains Multiple Choice Questions. Select the single best option.',
            '3. Section B contains Descriptive / Writing Questions. Write answers in the space provided.',
            '4. Figures to the right indicate full marks for each question.'
          ];

      doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold').text('INSTRUCTIONS TO CANDIDATES:');
      doc.fillColor('#475569').fontSize(8).font('Helvetica');
      instructions.forEach(ins => {
        doc.text(ins, { indent: 10 });
      });
      doc.moveDown(0.8);

      doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#4338ca').lineWidth(1.5).stroke();
      doc.moveDown(0.8);

      const mcqs = questions.filter(q => q.question_type === 'MCQ');
      const writings = questions.filter(q => q.question_type === 'WRITING');

      let currentQNum = 1;

      // SECTION A: MCQ
      if (mcqs.length > 0) {
        doc.fillColor('#312e81').fontSize(11).font('Helvetica-Bold')
          .text(`SECTION A: MULTIPLE CHOICE QUESTIONS (${mcqs.length} Questions)`, { underline: true })
          .moveDown(0.5);

        mcqs.forEach((q) => {
          if (doc.y > 690) {
            doc.addPage();
          }

          const qY = doc.y;
          const qNumText = `Q${currentQNum}. `;
          doc.fillColor('#0f172a').fontSize(9.5).font('Helvetica-Bold');
          doc.text(qNumText, 40, qY, { continued: false });

          const marksText = `[${q.marks || 1} Marks]`;
          doc.fillColor('#4338ca').fontSize(8.5).font('Helvetica-Bold');
          doc.text(marksText, 490, qY, { align: 'right', width: 65 });

          doc.fillColor('#1e293b').fontSize(9).font('Helvetica');
          doc.text(q.question_text, 65, qY, { width: 420 });
          doc.moveDown(0.3);

          // Options A, B, C, D
          const optA = q.option_a || 'None';
          const optB = q.option_b || 'None';
          const optC = q.option_c || 'None';
          const optD = q.option_d || 'None';

          doc.fontSize(8.5).fillColor('#334155');
          const leftY1 = doc.y;
          doc.text(`(A) ${optA}`, 65, leftY1, { width: 225 });
          const leftY2 = doc.y;
          doc.text(`(B) ${optB}`, 300, leftY1, { width: 225 });

          const nextRowY = Math.max(leftY2, doc.y) + 2;
          doc.text(`(C) ${optC}`, 65, nextRowY, { width: 225 });
          const leftY3 = doc.y;
          doc.text(`(D) ${optD}`, 300, nextRowY, { width: 225 });

          doc.y = Math.max(leftY3, doc.y) + 8;
          currentQNum++;
        });

        doc.moveDown(0.5);
      }

      // SECTION B: WRITING
      if (writings.length > 0) {
        if (doc.y > 650) {
          doc.addPage();
        }

        doc.fillColor('#312e81').fontSize(11).font('Helvetica-Bold')
          .text(`SECTION B: DESCRIPTIVE & WRITING QUESTIONS (${writings.length} Questions)`, { underline: true })
          .moveDown(0.5);

        writings.forEach((q) => {
          if (doc.y > 670) {
            doc.addPage();
          }

          const qY = doc.y;
          const qNumText = `Q${currentQNum}. `;
          doc.fillColor('#0f172a').fontSize(9.5).font('Helvetica-Bold');
          doc.text(qNumText, 40, qY, { continued: false });

          const marksText = `[${q.marks || 5} Marks]`;
          doc.fillColor('#4338ca').fontSize(8.5).font('Helvetica-Bold');
          doc.text(marksText, 490, qY, { align: 'right', width: 65 });

          doc.fillColor('#1e293b').fontSize(9).font('Helvetica');
          doc.text(q.question_text, 65, qY, { width: 420 });
          doc.moveDown(0.4);

          const linesToDraw = 4;
          let lineY = doc.y + 4;
          for (let i = 0; i < linesToDraw; i++) {
            doc.moveTo(65, lineY).lineTo(550, lineY).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
            lineY += 14;
          }
          doc.y = lineY + 4;
          currentQNum++;
        });
      }

      // SECTION C: OPTIONAL ADMIN EVALUATOR ANSWER KEY
      if (includeAnswers) {
        doc.addPage();

        doc
          .rect(40, 40, 515, 30)
          .fillAndStroke('#fee2e2', '#ef4444');

        doc
          .fillColor('#b91c1c')
          .fontSize(11)
          .font('Helvetica-Bold')
          .text('CONFIDENTIAL - ADMIN & EVALUATOR ANSWER KEY', 40, 49, { align: 'center' });

        doc.y = 82;
        doc.fillColor('#64748b').fontSize(8).font('Helvetica').text('Strictly for administrator and instructor reference. Not for student distribution.', { align: 'center' });
        doc.moveDown(1);

        if (mcqs.length > 0) {
          doc.fillColor('#1e1b4b').fontSize(10).font('Helvetica-Bold').text('Section A: MCQ Answer Matrix');
          doc.moveDown(0.3);

          let mcqIndex = 1;
          mcqs.forEach((q) => {
            if (doc.y > 700) doc.addPage();

            const y = doc.y;
            doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold');
            doc.text(`Q${mcqIndex}. Correct: Option (${q.correct_answer || 'N/A'})`, 45, y);

            if (q.explanation) {
              doc.fillColor('#475569').fontSize(8).font('Helvetica');
              doc.text(`Explanation: ${q.explanation}`, 60, doc.y + 2, { width: 480 });
            }
            doc.moveDown(0.4);
            mcqIndex++;
          });

          doc.moveDown(0.8);
        }

        if (writings.length > 0) {
          if (doc.y > 670) doc.addPage();

          doc.fillColor('#1e1b4b').fontSize(10).font('Helvetica-Bold').text('Section B: Writing Rubric & Model Answers');
          doc.moveDown(0.3);

          let wIndex = mcqs.length + 1;
          writings.forEach((q) => {
            if (doc.y > 680) doc.addPage();

            doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold');
            doc.text(`Q${wIndex}. Evaluation Guidelines [Max ${q.marks || 5} Marks]`, 45, doc.y);

            if (q.expected_answer) {
              doc.fillColor('#0369a1').fontSize(8).font('Helvetica-Bold').text('Expected Model Answer:', 55, doc.y + 2);
              doc.fillColor('#334155').fontSize(8).font('Helvetica').text(q.expected_answer, 55, doc.y + 1, { width: 490 });
            }

            if (q.rubric) {
              doc.fillColor('#7c3aed').fontSize(8).font('Helvetica-Bold').text('Grading Rubric:', 55, doc.y + 2);
              doc.fillColor('#334155').fontSize(8).font('Helvetica').text(q.rubric, 55, doc.y + 1, { width: 490 });
            }

            doc.moveDown(0.5);
            wIndex++;
          });
        }
      }

      // Add page numbers on all buffered pages
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc
          .fillColor('#94a3b8')
          .fontSize(8)
          .font('Helvetica')
          .text(
            `Page ${i + 1} of ${range.count} | Student Assessment Portal AI Question Paper | Admin Exclusive`,
            40,
            800,
            { align: 'center', width: 515 }
          );
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}