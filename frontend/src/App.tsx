import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { AuthProvider, useAuth } from './context/AuthContext'
import { RealtimeProvider } from './context/RealtimeContext'
import { ProtectedRoute, PermissionRoute } from './components/auth/ProtectedRoute'
import { Header } from './components/layout/Header'
import { RoleSidebar } from './components/layout/RoleSidebar'
import { WorkflowIndicator } from './components/workflow/WorkflowIndicator'
import { SihDemoBanner } from './components/layout/SihDemoBanner'
import { EmergencyReplanModal } from './pages/emergency/EmergencyReplanModal'

// Pages
import Login from './pages/Login'
import RoleDashboard from './pages/dashboards/RoleDashboard'
import Maintenance from './pages/Maintenance'
import NewMaintenanceWizard from './pages/maintenance/NewMaintenanceWizard'
import TaskDetail from './pages/TaskDetail'
import PlanGenerationWorkflow from './pages/planning/PlanGenerationWorkflow'
import PlanReviewDetail from './pages/planning/PlanReviewDetail'
import PlanComparison from './pages/planning/PlanComparison'
import FieldExecution from './pages/execution/FieldExecution'
import Corridor2DView from './pages/corridors/Corridor2DView'
import CorridorDetail from './pages/CorridorDetail'
import AdminConsole from './pages/admin/AdminConsole'
import UserManagement from './pages/admin/UserManagement'
import RoleManagement from './pages/admin/RoleManagement'
import Profile from './pages/Profile'
import Analytics from './pages/Analytics'
import Scenarios from './pages/Scenarios'
import WorkflowDiagnostics from './pages/admin/WorkflowDiagnostics'

const queryClient = new QueryClient()

const MainLayout: React.FC = () => {
  const { user } = useAuth()
  const location = useLocation()
  const [demoStep, setDemoStep] = useState<number>(1)
  const [emergencyModalOpen, setEmergencyModalOpen] = useState<boolean>(false)

  // Map route to workflow step (1 to 9)
  let currentWorkflowStep = 1
  if (location.pathname.startsWith('/maintenance/new')) currentWorkflowStep = 1
  else if (location.pathname.startsWith('/tasks/')) currentWorkflowStep = 2
  else if (location.pathname === '/planner') currentWorkflowStep = 3
  else if (location.pathname.startsWith('/plans/')) currentWorkflowStep = 5
  else if (location.pathname === '/execution') currentWorkflowStep = 7
  else if (location.pathname === '/analytics') currentWorkflowStep = 8
  else if (location.pathname === '/scenarios') currentWorkflowStep = 9

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      {/* Top Navbar */}
      <Header onOpenEmergencyModal={() => setEmergencyModalOpen(true)} />

      {/* 9-Step Visual Workflow Indicator (Section 2) */}
      <WorkflowIndicator currentStep={currentWorkflowStep} />

      {/* Guided 1-Click SIH Demo Stepper Banner */}
      <SihDemoBanner
        currentStep={demoStep}
        onStepChange={(s) => setDemoStep(s)}
        onTriggerEmergency={() => setEmergencyModalOpen(true)}
      />

      <div className="flex-1 flex">
        {/* Role-Based Navigation Sidebar */}
        <RoleSidebar />

        {/* Main Application Workspace */}
        <main className="flex-1 overflow-x-hidden min-h-[calc(100vh-140px)] bg-slate-100/50">
          <Routes>
            <Route path="/" element={<RoleDashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route
              path="/maintenance/new"
              element={
                <PermissionRoute permission="maintenance:create">
                  <NewMaintenanceWizard />
                </PermissionRoute>
              }
            />
            <Route path="/tasks/:id" element={<TaskDetail />} />
            <Route path="/planner" element={<PlanGenerationWorkflow />} />
            <Route path="/plans/:id" element={<PlanReviewDetail />} />
            <Route path="/planner/compare" element={<PlanComparison />} />
            <Route path="/execution" element={<FieldExecution />} />
            <Route path="/corridors" element={<Corridor2DView />} />
            <Route path="/corridors/:id" element={<CorridorDetail />} />
            <Route
              path="/admin"
              element={
                <PermissionRoute permission="system:settings">
                  <AdminConsole />
                </PermissionRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <PermissionRoute permission="users:view">
                  <UserManagement />
                </PermissionRoute>
              }
            />
            <Route
              path="/admin/roles"
              element={
                <PermissionRoute permission="roles:view">
                  <RoleManagement />
                </PermissionRoute>
              }
            />
            <Route
              path="/admin/audit"
              element={
                <PermissionRoute permission="system:audit">
                  <AdminConsole />
                </PermissionRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <PermissionRoute permission="system:settings">
                  <AdminConsole />
                </PermissionRoute>
              }
            />
            <Route
              path="/admin/diagnostics"
              element={
                <PermissionRoute permission="system:settings">
                  <WorkflowDiagnostics />
                </PermissionRoute>
              }
            />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/scenarios" element={<Scenarios />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Emergency Re-plan Modal Accessible Globally */}
      <EmergencyReplanModal
        isOpen={emergencyModalOpen}
        onClose={() => setEmergencyModalOpen(false)}
      />
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RealtimeProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </RealtimeProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App