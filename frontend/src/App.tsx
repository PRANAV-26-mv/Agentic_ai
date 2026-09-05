import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import { LoginPage } from './pages/LoginPage';
import { StudentLayout } from './layouts/StudentLayout';
import { AdminLayout } from './layouts/AdminLayout';

import { StudentDashboard } from './pages/StudentDashboard';
import { StudentMaterials } from './pages/StudentMaterials';
import { StudentAssessments } from './pages/StudentAssessments';
import { StudentAssessmentTake } from './pages/StudentAssessmentTake';
import { StudentResults } from './pages/StudentResults';
import { StudentAttendance } from './pages/StudentAttendance';
import { StudentNotifications } from './pages/StudentNotifications';
import { AskADoubt } from './pages/AskADoubt';
import { StudentProfile } from './pages/StudentProfile';

import { AdminDashboard } from './pages/AdminDashboard';
import { StudentManagement } from './pages/StudentManagement';
import { AssessmentManagement } from './pages/AssessmentManagement';
import { QuestionBank } from './pages/QuestionBank';
import { StudyMaterialManagement } from './pages/StudyMaterialManagement';
import { AttendanceManagement } from './pages/AttendanceManagement';
import { NotificationManagement } from './pages/NotificationManagement';
import { AdminResults } from './pages/AdminResults';
import { WritingEvaluation } from './pages/WritingEvaluation';
import { AssessmentMonitoring } from './pages/AssessmentMonitoring';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { AdminManagement } from './pages/AdminManagement';

const ProtectedStudentRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, role, loading } = useAuth();
  if (loading) return <div className="p-8 text-center text-xs text-slate-500 font-bold">Loading...</div>;
  if (!user || role !== 'STUDENT') return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, role, loading } = useAuth();
  if (loading) return <div className="p-8 text-center text-xs text-slate-500 font-bold">Loading...</div>;
  if (!user || role !== 'ADMIN') return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const ProtectedSuperAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, role, loading } = useAuth();
  if (loading) return <div className="p-8 text-center text-xs text-slate-500 font-bold">Loading...</div>;
  const isSuper = user?.email?.toLowerCase() === 'pranavannur9659@gmail.com' || user?.is_super_admin;
  if (!user || role !== 'ADMIN' || !isSuper) return <Navigate to="/admin/dashboard" replace />;
  return <>{children}</>;
};

const RootRedirect: React.FC = () => {
  const { user, role, loading } = useAuth();
  if (loading) return <div className="p-8 text-center text-xs text-slate-500 font-bold">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
};

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          {/* Root Redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Distraction-Free Assessment View */}
          <Route
            path="/assessments/take/:id"
            element={
              <ProtectedStudentRoute>
                <StudentAssessmentTake />
              </ProtectedStudentRoute>
            }
          />

          {/* Student Portal Routes */}
          <Route
            element={
              <ProtectedStudentRoute>
                <StudentLayout />
              </ProtectedStudentRoute>
            }
          >
            <Route path="/dashboard" element={<StudentDashboard />} />
            <Route path="/materials" element={<StudentMaterials />} />
            <Route path="/assessments" element={<StudentAssessments />} />
            <Route path="/results" element={<StudentResults />} />
            <Route path="/attendance" element={<StudentAttendance />} />
            <Route path="/notifications" element={<StudentNotifications />} />
            <Route path="/ask-doubt" element={<AskADoubt />} />
            <Route path="/profile" element={<StudentProfile />} />
          </Route>

          {/* Admin Portal Routes */}
          <Route
            element={
              <ProtectedAdminRoute>
                <AdminLayout />
              </ProtectedAdminRoute>
            }
          >
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/students" element={<StudentManagement />} />
            <Route path="/admin/assessments" element={<AssessmentManagement />} />
            <Route path="/admin/question-bank" element={<QuestionBank />} />
            <Route path="/admin/study-materials" element={<StudyMaterialManagement />} />
            <Route path="/admin/attendance" element={<AttendanceManagement />} />
            <Route path="/admin/notifications" element={<NotificationManagement />} />
            <Route path="/admin/results" element={<AdminResults />} />
            <Route path="/admin/evaluation" element={<WritingEvaluation />} />
            <Route path="/admin/monitoring" element={<AssessmentMonitoring />} />
            <Route path="/admin/analytics" element={<AnalyticsPage />} />
            <Route path="/admin/audit-log" element={<AuditLogPage />} />
            <Route
              path="/admin/manage-admins"
              element={
                <ProtectedSuperAdminRoute>
                  <AdminManagement />
                </ProtectedSuperAdminRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
