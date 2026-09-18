import { apiClient as api, API_BASE } from '../lib/apiClient'

export { api, api as apiClient, API_BASE }
export default api

// Authentication & Users
export async function loginUser(credentials: { username: string; password: string }) {
  const res = await api.post('/auth/login', credentials)
  return res.data
}

export async function logoutUser() {
  const refreshToken = localStorage.getItem('railopt_refresh_token')
  try {
    await api.post('/auth/logout', { refresh_token: refreshToken })
  } catch (e) {
    // silent
  }
}

export async function fetchCurrentUser() {
  const res = await api.get('/auth/me')
  return res.data
}

export async function fetchDemoUsers() {
  const res = await api.get('/auth/demo-users')
  return res.data
}

// User Management (Admin)
export async function fetchUsers(params?: { search?: string; role?: string; department?: string }) {
  const res = await api.get('/users', { params })
  return res.data
}

export async function createUser(data: {
  employee_id: string
  full_name: string
  email: string
  password: string
  role: string
  department: string
  division_id?: number
  section_code?: string
}) {
  const res = await api.post('/users', data)
  return res.data
}

export async function updateUser(userId: number, data: any) {
  const res = await api.put(`/users/${userId}`, data)
  return res.data
}

export async function toggleUserStatus(userId: number, isActive: boolean) {
  const res = await api.put(`/users/${userId}/status`, { is_active: isActive })
  return res.data
}

export async function resetUserPassword(userId: number, newPassword: string) {
  const res = await api.post(`/users/${userId}/reset-password`, { new_password: newPassword })
  return res.data
}

export async function fetchRoles() {
  const res = await api.get('/system/roles')
  return res.data
}

export async function fetchSystemSettings() {
  const res = await api.get('/system/settings')
  return res.data
}

export async function updateSystemSettings(settings: any) {
  const res = await api.post('/system/settings', settings)
  return res.data
}

export async function fetchAuditTrail(limit: number = 100) {
  const res = await api.get('/system/audit', { params: { limit } })
  return res.data
}


// Corridors & Sections
export async function fetchCorridors() {
  const res = await api.get('/corridors')
  return res.data
}

export async function fetchCorridor(id: number | string) {
  const res = await api.get(`/corridors/${id}`)
  return res.data
}

// Assets
export async function fetchAssets(params?: { corridor_id?: number; department?: string; asset_type?: string; page?: number; page_size?: number }) {
  const res = await api.get('/assets', { params })
  return res.data
}

export async function fetchAsset(id: number | string) {
  const res = await api.get(`/assets/${id}`)
  return res.data
}

// Maintenance Tasks & Priority
export async function fetchTasks(params?: {
  department?: string
  status?: string
  severity_min?: number
  corridor_id?: number
  page?: number
  page_size?: number
  my_issues?: boolean
  assigned_to_me?: boolean
  completed?: boolean
  scope?: string
}) {
  const res = await api.get('/tasks', { params })
  return res.data
}

export const fetchMaintenanceTasks = fetchTasks

export async function fetchTask(id: number | string) {
  const res = await api.get(`/tasks/${id}`)
  return res.data
}

export async function fetchTaskPriority(id: number | string) {
  const res = await api.get(`/tasks/${id}/priority`)
  return res.data
}

export async function createTask(payload: any) {
  const res = await api.post('/tasks', payload)
  return res.data
}

export async function approveTask(id: number | string, data?: { comments?: string; assigned_to_user_id?: number }) {
  const res = await api.post(`/tasks/${id}/approve`, data || {})
  return res.data
}

export async function rejectTask(id: number | string, data: { reason: string }) {
  const res = await api.post(`/tasks/${id}/reject`, data)
  return res.data
}

export async function clarifyTask(id: number | string, data: { comments: string }) {
  const res = await api.post(`/tasks/${id}/clarify`, data)
  return res.data
}

export async function assignTask(id: number | string, data: { assigned_to_user_id: number; instructions?: string }) {
  const res = await api.post(`/tasks/${id}/assign`, data)
  return res.data
}

export async function startTaskWork(id: number | string, data?: { notes?: string }) {
  const res = await api.post(`/tasks/${id}/start`, data || {})
  return res.data
}

export async function resolveTaskWork(id: number | string, data: { actual_duration_minutes?: number; completion_notes: string; photo_evidence?: string }) {
  const res = await api.post(`/tasks/${id}/resolve`, data)
  return res.data
}

export async function verifyTaskWork(id: number | string, data?: { verification_notes?: string }) {
  const res = await api.post(`/tasks/${id}/verify`, data || {})
  return res.data
}

// Railway Authorities
export async function fetchAuthorities() {
  const res = await api.get('/authorities')
  return res.data
}

export async function escalateAuthority(data: { contact_id: string; issue_reference?: string; channel: string; message: string }) {
  const res = await api.post('/authorities/escalate', data)
  return res.data
}

// Planning Workflow
export async function fetchAvailableWindows(corridorId: number = 2, sectionId: number = 2) {
  const res = await api.get('/planning/windows', { params: { corridor_id: corridorId, section_id: sectionId } })
  return res.data
}

export async function generateRecommendedPlan(payload?: {
  corridor_ids?: number[]
  departments?: string[]
  max_solve_time_seconds?: number
}) {
  const res = await api.post('/planning/generate', payload || { corridor_ids: [2] })
  return res.data
}

export async function fetchPlans(params?: { status?: string; corridor_id?: number }) {
  const res = await api.get('/planning', { params })
  return res.data
}

export async function fetchPlan(id: number | string) {
  const res = await api.get(`/planning/${id}`)
  return res.data
}

export async function submitPlanForReview(planId: number | string) {
  const res = await api.post(`/planning/${planId}/submit-review`)
  return res.data
}

export async function approvePlan(planId: number | string, comments?: string) {
  const res = await api.post(`/planning/${planId}/approve`, { comments: comments || 'Approved for possession' })
  return res.data
}

export async function rejectPlan(planId: number | string, reason: string) {
  const res = await api.post(`/planning/${planId}/reject`, { reason })
  return res.data
}

export async function fetchBaselineComparison(planId?: number | string) {
  const res = await api.get('/planning/compare/baseline', { params: { plan_id: planId } })
  return res.data
}

export async function fetchIssueAiPlan(taskId: number | string) {
  const res = await api.get(`/planning/issue-plan/${taskId}`)
  return res.data
}

export async function approveIssuePlan(taskId: number | string, payload?: { comments?: string; assigned_engineer_id?: number }) {
  const res = await api.post(`/planning/issue-plan/${taskId}/approve`, payload || {})
  return res.data
}

// Field Execution
export async function fetchTodayWork() {
  const res = await api.get('/execution/today')
  return res.data
}

export async function startWork(assignmentId: number, notes?: string) {
  const res = await api.post(`/execution/${assignmentId}/start`, { notes: notes || 'Work started' })
  return res.data
}

export async function completeWork(assignmentId: number, data: { actual_duration_minutes: number; completion_note: string; issue_encountered?: string }) {
  const res = await api.post(`/execution/${assignmentId}/complete`, data)
  return res.data
}

export async function uploadEvidence(assignmentId: number, data: { file_name: string; file_type?: string; file_data?: string; comments?: string }) {
  const res = await api.post(`/execution/${assignmentId}/evidence`, data)
  return res.data
}

export async function reportExecutionProblem(
  assignmentId: number,
  data: {
    issue_category: string
    description: string
    is_critical: boolean
    photo_evidence?: string
  }
) {
  const res = await api.post(`/execution/${assignmentId}/report-problem`, data)
  return res.data
}

// Emergency Scenario & Replanning
export async function reportEmergencyDefect(payload: {
  section_code?: string
  asset_name?: string
  issue_description?: string
  severity?: string
  detected_time?: string
}) {
  const res = await api.post('/emergency/report', payload)
  return res.data
}

// Notifications
export async function fetchNotifications() {
  const res = await api.get('/notifications')
  return res.data
}

export async function markNotificationRead(id: number) {
  const res = await api.post(`/notifications/${id}/read`)
  return res.data
}

export async function markAllNotificationsRead() {
  const res = await api.post('/notifications/read-all')
  return res.data
}

// Admin & Telemetry
export async function fetchTechnicalSolverInfo() {
  const res = await api.get('/admin/technical-solver')
  return res.data
}

export async function resetDemoScenario() {
  const res = await api.post('/admin/reset-demo')
  return res.data
}

export async function fetchAuditLogs(limit: number = 50) {
  const res = await api.get('/admin/audit-logs', { params: { limit } })
  return res.data
}

// Blocks, Trains, Analytics
export async function fetchBlockWindows(params?: { corridor_id?: number; section_id?: number; status?: string }) {
  const res = await api.get('/blocks', { params })
  return res.data
}

export async function fetchTrains() {
  const res = await api.get('/trains')
  return res.data
}

export async function fetchTrainMovements(params?: { corridor_id?: number; section_id?: number }) {
  const res = await api.get('/trains/movements', { params })
  return res.data
}

export async function fetchAnalyticsOverview() {
  const res = await api.get('/analytics/overview')
  return res.data
}

export async function askAssistant(query: string) {
  const res = await api.post('/ai/query', { prompt: query })
  return res.data
}

export function getPlanExportUrl(planId: number, format: string = 'csv') {
  return `${API_BASE}/plans/${planId}/export?format=${format}`
}

export async function fetchPresetScenarios() {
  const res = await api.get('/scenarios')
  return res.data
}

export async function fetchDatabaseHealth() {
  const res = await api.get('/health/database')
  return res.data
}

export async function fetchTimeline(params?: { corridor_id?: number; date?: string; department?: string; show_history?: boolean }) {
  const res = await api.get('/timeline', { params })
  return res.data
}

export async function fetchCriticalEvents() {
  const res = await api.get('/emergency/events')
  return res.data
}

export async function replanCriticalEvent(eventId: number) {
  const res = await api.post(`/emergency/${eventId}/replan`)
  return res.data
}

export async function fetchWorkflowDiagnostics(requestId?: number) {
  const res = await api.get('/admin/diagnostics', { params: { request_id: requestId } })
  return res.data
}

export async function fetchRequestTrace(requestId: number) {
  const res = await api.get(`/admin/trace/${requestId}`)
  return res.data
}

export async function triggerReplan(payload: { plan_id: number; event: any }) {
  const res = await api.post('/replan', payload)
  return res.data
}
