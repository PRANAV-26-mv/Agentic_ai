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
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center space-x-2">
            <FileCheck className="w-5 h-5 sm:w-6 sm:h-6 text-brand-600 shrink-0" />
            <span>Assigned Assessments</span>
          </h2>
          <p className="text-slate-500 text-xs mt-1">Complete your MCQ and Writing evaluations before the deadline.</p>
        </div>
      </div>

      {/* Assessment List */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-36 bg-slate-200 rounded-2xl"></div>
          <div className="h-36 bg-slate-200 rounded-2xl"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {assessments.map((ass) => {
            const attempt = getAttemptForAssessment(ass.id);
            const isCompleted = attempt && (attempt.status === 'COMPLETED' || attempt.status === 'AUTO_SUBMITTED');
            const isInProgress = attempt && attempt.status === 'IN_PROGRESS';

            return (
              <div key={ass.id} className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 sm:p-6 shadow-sm transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                
                <div className="space-y-2 max-w-2xl">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="bg-brand-100 text-brand-800 text-xs font-bold px-3 py-0.5 rounded-full">
                      {ass.type} Assessment
                    </span>
                    <span className="bg-slate-100 text-slate-700 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{ass.duration_minutes} Mins</span>
                    </span>
                    <span className="bg-purple-50 text-purple-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      {ass.question_selection_mode === 'RANDOMIZED_POOL' ? '🎲 Randomized Pool Draw' : '📌 Fixed Set'}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">{ass.title}</h3>
                  <p className="text-xs text-slate-500">{ass.description}</p>
                  
                  <div className="text-[11px] text-slate-400">
                    Passing threshold: <span className="font-semibold text-slate-600">{ass.passing_percentage}%</span> • Max marks: <span className="font-semibold text-slate-600">{ass.max_marks}</span>
                  </div>
                </div>

                {/* Status Badge / Action Button matching §20 rule */}
                <div className="w-full md:w-auto">
                  {isCompleted ? (
                    <div className="flex flex-col items-start md:items-end space-y-1">
                      <span className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="w-4 h-4 mr-1.5 shrink-0" />
                        COMPLETED ({attempt.percentage}%)
                      </span>
                      <span className="text-[11px] text-slate-400">Submitted on {new Date(attempt.submitted_at!).toLocaleDateString()}</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleStart(ass.id)}
                      className={`w-full md:w-auto px-6 py-3 font-bold text-xs rounded-xl shadow-md flex items-center justify-center space-x-2 transition-all ${
                        isInProgress
                          ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse'
                          : 'bg-brand-600 hover:bg-brand-700 text-white'
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
