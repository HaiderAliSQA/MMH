import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Accept': 'application/json',
  },
  withCredentials: false,
})

// Add JWT token and log API calls with portal context
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mmh_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Portal detection based on current URL path
    const portal = window.location.pathname.split('/')[1] || 'root';
    const timestamp = new Date().toLocaleTimeString();

    console.log(
      `%c 🚀 [${timestamp}] [API ${config.method?.toUpperCase()}] %c ${config.url} %c | Portal: ${portal}`,
      'color: #0ea5e9; font-weight: bold;',
      'color: #94a3b8;',
      'color: #10b981; font-weight: bold;'
    );

    return config
  },
  (error) => Promise.reject(error)
)

// 401 interceptor — clears session and sends user to login.
// We intentionally exclude auth-endpoint URLs so that:
//   - login (POST /auth/login) can surface its own errors (wrong password, 409 etc.)
//   - verify (GET /auth/verify) can bubble errors up to useSessionGuard
//   - force-login (POST /auth/force-login) can bubble errors up to Login.tsx
// Every other 401 means the token/session is gone → hard redirect.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url    = error.config?.url || '';
    const is401  = error.response?.status === 401;

    // Endpoints that handle their own 401 / error responses
    const isAuthEndpoint =
      url.includes('/auth/login')       ||
      url.includes('/users/login')      ||
      url.includes('/auth/force-login') ||
      url.includes('/auth/verify')      ||
      url.includes('/auth/logout');

    if (is401 && !isAuthEndpoint) {
      // Persist a helpful message for the Login page
      const code = error.response?.data?.code;
      if (code === 'SESSION_INVALID') {
        localStorage.setItem('mmh_logout_msg', 'Your session was ended on another device.');
      } else if (code === 'SESSION_EXPIRED') {
        localStorage.setItem('mmh_logout_msg', 'Your session expired. Please log in again.');
      } else {
        localStorage.setItem('mmh_logout_msg', 'Your session has ended. Please log in again.');
      }

      localStorage.removeItem('mmh_token');
      localStorage.removeItem('mmh_user');
      localStorage.removeItem('mmh_expires');

      // Always redirect — works for ALL portals including Doctor/Lab/Receptionist
      // that don't use MainLayout/useSessionGuard
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
)

export default api

// ─── Auth API ────────────────────────────────────────────────────────────────
export const authAPI = {
  /** Session-aware login. Returns 409 SESSION_EXISTS when already logged in. */
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  /** Force-login: kills the old session and creates a new one here. */
  forceLogin: (data: { conflictToken: string }) =>
    api.post('/auth/force-login', data),

  /** Marks the current DB session as manually logged out. */
  logout: () =>
    api.post('/auth/logout'),

  /** Ping the server to verify the session is still active (called every 5 min). */
  verifySession: () =>
    api.get('/auth/verify'),

  getMe: () => api.get('/auth/me'),

  changePassword: (data: object) =>
    api.post('/auth/change-password', data),

  updateProfile: (data: object) =>
    api.put('/auth/profile', data),
}

export const patientAPI = {
  getAll:  (params?: object) => api.get('/patients', { params }),
  getOne:  (id: string) => api.get(`/patients/${id}`),
  create:  (data: object) => api.post('/patients', data),
  update:  (id: string, data: object) => api.put(`/patients/${id}`, data),
  search:  (q: string) => api.get('/patients/search', { params: { q } }),
}

export const opdAPI = {
  getToday: () => api.get('/opd'),
  getDoctorAllVisits: (params?: object) => api.get('/opd/doctor/all', { params }),
  getPatientOPD: (patientId: string) => api.get(`/opd/patient/${patientId}`),
  create:   (data: object) => api.post('/opd', data),
  updateStatus: (id: string, status: string) =>
    api.put(`/opd/${id}/status`, { status }),
}

export const prescriptionAPI = {
  getForDoctor: () => api.get('/prescriptions/doctor'),
  getForPatient: (patientId: string) => api.get(`/prescriptions/patient/${patientId}`),
  create: (data: object) => api.post('/prescriptions', data),
  updateRoutingStatus: (id: string, routingStatus: string) => api.put(`/prescriptions/${id}/routing-status`, { routingStatus }),
}

export const admissionAPI = {
  getAll:    () => api.get('/admissions'),
  create:    (data: object) => api.post('/admissions', data),
  discharge: (id: string) => api.put(`/admissions/${id}/discharge`),
}

export const labAPI = {
  getAll: (params?: any) =>
    api.get('/labs', { params }),
  create: (data: object) => api.post('/labs', data),
  updateStatus: (id: string, status: string) =>
    api.put(`/labs/${id}/status`, { status }),
  updateResults: (id: string, results: object[]) =>
    api.put(`/labs/${id}/results`, { results }),
}

export const pharmacyAPI = {
  getMedicines: (params?: object) => api.get('/medicines', { params }),
  createMedicine: (data: object) => api.post('/medicines', data),
  updateMedicine: (id: string, data: object) =>
    api.put(`/medicines/${id}`, data),
  dispense: (data: object) => api.post('/dispense', data),
}

export const medicineAPI = {
  getAll:   (params?: object) => api.get('/medicines', { params }),
  add:      (data: object) => api.post('/medicines', data),
  update:   (id: string, data: object) => api.put(`/medicines/${id}`, data),
  restock:  (id: string, data: object) => api.put(`/medicines/${id}/restock`, data),
}



export const paymentAPI = {
  getAll: (params?: object) => api.get('/payments', { params }),
  create: (data: object) => api.post('/payments', data),
}

export const adminAPI = {
  getStats:     () => api.get('/admin/stats'),
  getUsers:     () => api.get('/users'),
  createUser:   (data: object) => api.post('/users/register', data),
  updateUser:   (id: string, data: object) =>
    api.put(`/users/${id}`, data),
  getDoctors:   () => api.get('/doctors'),
  createDoctor: (data: object) => api.post('/doctors', data),
  updateDoctor: (id: string, data: object) =>
    api.put(`/doctors/${id}`, data),
  getWards:     () => api.get('/wards'),
  getBeds:      (wardId: string) =>
    api.get(`/wards/${wardId}/beds`),
}

export const hrAPI = {
  // Employees
  getEmployees:    (params?: object) => api.get('/hr/employees', { params }),
  createEmployee:  (data: object) => api.post('/hr/employees', data),
  updateEmployee:  (id: string, data: object) => api.put(`/hr/employees/${id}`, data),

  // Shifts
  getShifts:          (weekStart: string) => api.get('/hr/shifts', { params: { weekStart } }),
  saveShift:          (data: object) => api.post('/hr/shifts', data),
  getEmployeeShifts:  (id: string) => api.get(`/hr/shifts/employee/${id}`),

  // Attendance
  getAttendance:        (date: string) => api.get('/hr/attendance', { params: { date } }),
  getAttendanceRange:   (params: object) => api.get('/hr/attendance/range', { params }),
  markAttendance:       (data: object) => api.post('/hr/attendance/mark', data),
  bulkAttendance:       (data: object) => api.post('/hr/attendance/bulk', data),
  getAttendanceSummary: (month: number, year: number) => api.get('/hr/attendance/summary', { params: { month, year } }),

  // Leaves
  getLeaves:            (params?: object) => api.get('/hr/leaves', { params }),
  applyLeave:           (data: object) => api.post('/hr/leaves', data),
  approveLeave:         (id: string) => api.put(`/hr/leaves/${id}/approve`),
  rejectLeave:          (id: string, reason: string) => api.put(`/hr/leaves/${id}/reject`, { reason }),
  updateLeaveStatus:    (id: string, status: string, reason?: string) => api.put(`/hr/leaves/${id}/status`, { status, reason }),
  substituteResponse:   (id: string, response: string) => api.put(`/hr/leaves/${id}/substitute-response`, { response }),

  // Payroll
  getPayroll:    (month: number, year: number) => api.get('/hr/payroll', { params: { month, year } }),
  generateAll:   (month: number, year: number) => api.post('/hr/payroll/generate', { month, year }),
  generateOne:   (id: string, month: number, year: number) => api.post(`/hr/payroll/generate/${id}`, { month, year }),
  markPaid:      (id: string) => api.put(`/hr/payroll/${id}/mark-paid`),
  getSlip:       (id: string) => api.get(`/hr/payroll/slip/${id}`),

  // My Portal
  getMyLeaves:   () => api.get('/hr/leaves/my'),
  getMyBalance:  () => api.get('/hr/employees/my-balance'),
  cancelLeave:   (id: string) => api.put(`/hr/leaves/${id}/cancel`),
}

export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
}

export const dispensaryAPI = {
  getStatus:       () => api.get('/dispensary/status'),
  getStats:        () => api.get('/dispensary/stats'),
  getMedicines:    (params?: object) => api.get('/dispensary/medicines', { params }),
  addMedicine:     (data: object) => api.post('/dispensary/medicines', data),
  updateMedicine:  (id: string, data: object) => api.put(`/dispensary/medicines/${id}`, data),
  restockMedicine: (data: object) => api.post('/dispensary/medicines/restock', data),
  dispense:        (data: object) => api.post('/dispensary/dispense', data),
  getHistory:      (params?: object) => api.get('/dispensary/history', { params }),
}

export const reportsAPI = {
  dispensarySummary: (params: object) =>
    api.get('/reports/dispensary-summary', { params }),
  beneficiaries: (params: object) =>
    api.get('/reports/beneficiaries', { params }),
  fundUtilization: (params: object) =>
    api.get('/reports/fund-utilization', { params }),
  pharmacyRevenue: (params: object) =>
    api.get('/reports/pharmacy-revenue', { params }),
  boardSummary: (params: object) =>
    api.get('/reports/board-summary', { params }),
}
