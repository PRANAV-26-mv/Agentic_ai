import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Assessment, AssessmentAttempt } from '../types';
import { FileCheck, Clock, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const StudentAssessments: React.FC = () => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [attempts, setAttempts] = useState<AssessmentAttempt[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/assessments'),
      api.get('/results')
    ]).then(([assRes, resRes]) => {
      setAssessments(assRes.data);
      setAttempts(resRes.data);
    }).catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const getAttemptForAssessment = (assId: string) => {
    return attempts.find(a => a.assessment_id === assId);
  };

  const handleStart = (assId: string) => {
    navigate(`/assessments/take/${assId}`);
  };

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="apple-glass-card p-6 sm:p-7 rounded-[28px] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2.5">
            <FileCheck className="w-6 h-6 text-indigo-600 shrink-0" />
            <span>Assigned Assessments</span>
          </h2>
          <p className="text-slate-500 text-xs mt-1">Complete your formal evaluations and track your progress in real time.</p>
        </div>
      </div>

      {/* Assessment List */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-40 apple-glass-card rounded-3xl"></div>
          <div className="h-40 apple-glass-card rounded-3xl"></div>
        </div>
      ) : assessments.length === 0 ? (
        <div className="apple-glass-card rounded-3xl p-8 sm:p-12 text-center space-y-3">
          <FileCheck className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-extrabold text-slate-800 text-sm">No Assessments Assigned</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You currently have no pending assessments assigned to your cohort.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {assessments.map((ass) => {
            const attempt = getAttemptForAssessment(ass.id);
            const isCompleted = attempt && (attempt.status === 'COMPLETED' || attempt.status === 'AUTO_SUBMITTED');
            const isInProgress = attempt && attempt.status === 'IN_PROGRESS';

            return (
              <div 
                key={ass.id} 
                className="apple-glass-card rounded-[26px] p-5 sm:p-6 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div className="space-y-2.5 max-w-2xl min-w-0 flex-1">
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center">
                    <span className="apple-glass-pill bg-blue-50/70 border-blue-200/60 text-blue-800 text-[10px] sm:text-xs font-semibold px-3 py-1">
                      {ass.type} Assessment
                    </span>
                    <span className="apple-glass-pill text-slate-700 text-[10px] sm:text-xs font-medium px-3 py-1 flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{ass.duration_minutes} Mins</span>
                    </span>
                    <span className="apple-glass-pill bg-violet-50/70 border-violet-200/60 text-violet-800 text-[10px] sm:text-xs font-medium px-3 py-1">
                      {ass.question_selection_mode === 'RANDOMIZED_POOL' ? '🎲 Randomized Pool' : '📌 Fixed Set'}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-base sm:text-lg leading-snug break-words tracking-tight">
                    {ass.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 break-words">
                    {ass.description || 'Formal assessment evaluation.'}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 pt-0.5">
                    <span>Passing: <strong className="text-slate-700 font-bold">{ass.passing_percentage}%</strong></span>
                    <span>•</span>
                    <span>Max Marks: <strong className="text-slate-700 font-bold">{ass.max_marks}</strong></span>
                  </div>
                </div>

                {/* Status Badge / Action Button */}
                <div className="w-full md:w-auto shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-white/60">
                  {isCompleted ? (
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-2">
                      <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-900 border border-emerald-500/30 backdrop-blur-md">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 shrink-0 text-emerald-600" />
                        <span>COMPLETED ({attempt.percentage}%)</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(attempt.submitted_at!).toLocaleDateString()}
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleStart(ass.id)}
                      className={`w-full md:w-auto px-6 py-3 font-semibold text-xs rounded-full shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                        isInProgress
                          ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse'
                          : 'apple-btn-primary'
                      }`}
                    >
                      <span>{isInProgress ? 'Resume Assessment' : 'Start Assessment'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
