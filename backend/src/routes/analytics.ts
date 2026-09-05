import { Router, Request, Response } from 'express';
import { StudentsModel, AssessmentsModel, AssessmentAttemptsModel, AttendanceModel, StudyMaterialsModel } from '../models/dbModels.js';
import { requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

// GET /api/analytics
router.get('/', requireAdmin, (_req: Request, res: Response) => {
  const students = StudentsModel.findAll();
  const assessments = AssessmentsModel.findAll();
  const attempts = AssessmentAttemptsModel.findAll();
  const materials = StudyMaterialsModel.findAll();
  const sessions = AttendanceModel.findAllSessions();

  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.status === 'ACTIVE').length;
  const totalAssessments = assessments.length;
  const completedAttempts = attempts.filter(a => a.status === 'COMPLETED' || a.status === 'AUTO_SUBMITTED').length;
  
  const totalScores = attempts.reduce((acc, curr) => acc + (curr.percentage || 0), 0);
  const avgScore = attempts.length > 0 ? Math.round(totalScores / attempts.length) : 0;

  // Department analytics breakdown
  const deptStatsMap: Record<string, { count: number; totalScore: number; attempts: number }> = {};
  students.forEach(s => {
    if (!deptStatsMap[s.department]) {
      deptStatsMap[s.department] = { count: 0, totalScore: 0, attempts: 0 };
    }
    deptStatsMap[s.department].count += 1;
  });

  attempts.forEach(a => {
    const s = students.find(item => item.id === a.student_id);
    if (s && deptStatsMap[s.department]) {
      deptStatsMap[s.department].totalScore += a.percentage || 0;
      deptStatsMap[s.department].attempts += 1;
    }
  });

  const deptPerformance = Object.keys(deptStatsMap).map(dept => ({
    department: dept,
    studentsCount: deptStatsMap[dept].count,
    avgScore: deptStatsMap[dept].attempts > 0 ? Math.round(deptStatsMap[dept].totalScore / deptStatsMap[dept].attempts) : 0
  }));

  // Community analytics breakdown
  const commStatsMap: Record<string, { count: number; totalScore: number; attempts: number }> = {};
  students.forEach(s => {
    if (!commStatsMap[s.community]) {
      commStatsMap[s.community] = { count: 0, totalScore: 0, attempts: 0 };
    }
    commStatsMap[s.community].count += 1;
  });

  attempts.forEach(a => {
    const s = students.find(item => item.id === a.student_id);
    if (s && commStatsMap[s.community]) {
      commStatsMap[s.community].totalScore += a.percentage || 0;
      commStatsMap[s.community].attempts += 1;
    }
  });

  const communityPerformance = Object.keys(commStatsMap).map(comm => ({
    community: comm,
    studentsCount: commStatsMap[comm].count,
    avgScore: commStatsMap[comm].attempts > 0 ? Math.round(commStatsMap[comm].totalScore / commStatsMap[comm].attempts) : 0
  }));

  res.json({
    overview: {
      totalStudents,
      activeStudents,
      totalAssessments,
      completedAttempts,
      avgScore,
      totalMaterials: materials.length,
      totalSessions: sessions.length
    },
    deptPerformance,
    communityPerformance
  });
});

export default router;
