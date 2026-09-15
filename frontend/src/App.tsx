import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { AuthProvider, useAuth, getRoleDashboardPath } from './context/AuthContext'
import { RealtimeProvider } from './context/RealtimeContext'
import { ProtectedRoute, RoleRoute, PermissionRoute } from './components/auth/ProtectedRoute'

// Layouts
import InspectorLayout from './components/layout/InspectorLayout'
import ManagerLayout from './components/layout/ManagerLayout'
import EngineerLayout from './components/layout/EngineerLayout'
import AdminLayout from './components/layout/AdminLayout'

// Pages
import Login from './pages/Login'
import Profile from './pages/Profile'
import TaskDetail from './pages/TaskDetail'
import Analytics from './pages/Analytics'
import Scenarios from './pages/Scenarios'

// Inspector Pages
import InspectorDashboard from './pages/inspector/InspectorDashboard'
import InspectorReportIssue from './pages/inspector/InspectorReportIssue'
import InspectorIssuesList from './pages/inspector/InspectorIssuesList'
import InspectorCompletedIssues from './pages/inspector/InspectorCompletedIssues'
import InspectorTimetable from './pages/inspector/InspectorTimetable'

// Manager Pages
import { ManagerDashboard } from './pages/manager/ManagerDashboard'
import { ManagerAIPlanner } from './pages/manager/ManagerAIPlanner'
import ManagerIssueApproval from './pages/manager/ManagerIssueApproval'
import ManagerIssueStatus from './pages/manager/ManagerIssueStatus'
import { ManagerReplanView } from './pages/manager/ManagerReplanView'
import ManagerAuthorityContact from './pages/manager/ManagerAuthorityContact'
import ManagerTimetable from './pages/manager/ManagerTimetable'

// Engineer Pages
import EngineerDashboard from './pages/engineer/EngineerDashboard'
import EngineerWorkQueue from './pages/engineer/EngineerWorkQueue'
import EngineerReportIssue from './pages/engineer/EngineerReportIssue'
import EngineerTimetable from './pages/engineer/EngineerTimetable'

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import UserManagement from './pages/admin/UserManagement'
import RoleManagement from './pages/admin/RoleManagement'
import AdminConsole from './pages/admin/AdminConsole'
import WorkflowDiagnostics from './pages/admin/WorkflowDiagnostics'
import Corridor2DView from './pages/corridors/Corridor2DView'

const queryClient = new QueryClient()

const RoleDashboardRedirect: React.FC = () => {
  const { user, isLoading } = useAuth()
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  return <Navigate to={getRoleDashboardPath(user?.role)} replace />
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RealtimeProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Authentication */}
              <Route path="/login" element={<Login />} />

              {/* Dynamic Root Redirection to Active Role Dashboard */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <RoleDashboardRedirect />
                  </ProtectedRoute>
                }
              />

              {/* Shared Protected Pages */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tasks/:id"
                element={
                  <ProtectedRoute>
                    <TaskDetail />
                  </ProtectedRoute>
                }
              />

              {/* ============================================================== */}
              {/* 1. INSPECTOR WORKSPACE (/inspector/*) */}
              {/* ============================================================== */}
              <Route
                path="/inspector"
                element={
                  <ProtectedRoute>
                    <RoleRoute allowedRoles={['INSPECTOR', 'ADMIN']}>
                      <InspectorLayout />
                    </RoleRoute>
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/inspector/dashboard" replace />} />
                <Route path="dashboard" element={<InspectorDashboard />} />
                <Route path="timetable" element={<InspectorTimetable />} />
                <Route path="report-issue" element={<InspectorReportIssue />} />
                <Route path="issues" element={<InspectorIssuesList />} />
                <Route path="completed" element={<InspectorCompletedIssues />} />
                <Route path="notifications" element={<Analytics />} />
              </Route>

              {/* ============================================================== */}
              {/* 2. MANAGER WORKSPACE (/manager/*) */}
              {/* ============================================================== */}
              <Route
                path="/manager"
                element={
                  <ProtectedRoute>
                    <RoleRoute allowedRoles={['MANAGER', 'ADMIN']}>
                      <ManagerLayout />
                    </RoleRoute>
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/manager/dashboard" replace />} />
                <Route path="dashboard" element={<ManagerDashboard />} />
                <Route path="planner" element={<ManagerAIPlanner />} />
                <Route path="approvals" element={<ManagerIssueApproval />} />
                <Route path="status" element={<ManagerIssueStatus />} />
                <Route path="replan" element={<ManagerReplanView />} />
                <Route path="timetable" element={<ManagerTimetable />} />
                <Route path="engineers" element={<Analytics />} />
                <Route path="authorities" element={<ManagerAuthorityContact />} />
                <Route path="reports" element={<Analytics />} />
                <Route path="notifications" element={<Analytics />} />
              </Route>

              {/* ============================================================== */}
              {/* 3. ENGINEER WORKSPACE (/engineer/*) */}
              {/* ============================================================== */}
              <Route
                path="/engineer"
                element={
                  <ProtectedRoute>
                    <RoleRoute allowedRoles={['ENGINEER', 'ADMIN']}>
                      <EngineerLayout />
                    </RoleRoute>
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/engineer/dashboard" replace />} />
                <Route path="dashboard" element={<EngineerDashboard />} />
                <Route path="pending-work" element={<EngineerWorkQueue initialFilter="PENDING" />} />
                <Route path="approved-work" element={<EngineerWorkQueue initialFilter="ALL" />} />
                <Route path="completed-work" element={<EngineerWorkQueue initialFilter="COMPLETED" />} />
                <Route path="report-issue" element={<EngineerReportIssue />} />
                <Route path="timetable" element={<EngineerTimetable />} />
                <Route path="notifications" element={<Analytics />} />
              </Route>

              {/* ============================================================== */}
              {/* 4. ADMIN WORKSPACE (/admin/*) */}
              {/* ============================================================== */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <RoleRoute allowedRoles={['ADMIN']}>
                      <AdminLayout />
                    </RoleRoute>
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="roles" element={<RoleManagement />} />
                <Route path="timetable" element={<ManagerTimetable />} />
                <Route path="issues" element={<ManagerIssueStatus />} />
                <Route path="work-orders" element={<EngineerWorkQueue initialFilter="ALL" />} />
                <Route path="authorities" element={<ManagerAuthorityContact />} />
                <Route path="sections" element={<Corridor2DView />} />
                <Route path="settings" element={<AdminConsole />} />
                <Route path="reports" element={<Analytics />} />
                <Route path="audit" element={<AdminConsole />} />
                <Route path="diagnostics" element={<WorkflowDiagnostics />} />
              </Route>

              {/* Catch-all: dynamically send user to their dedicated role workspace */}
              <Route path="*" element={<RoleDashboardRedirect />} />
            </Routes>
          </BrowserRouter>
        </RealtimeProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App