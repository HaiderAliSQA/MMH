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

// Add JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mmh_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Handle responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('mmh_token')
      localStorage.removeItem('mmh_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  getMe: () => api.get('/auth/me'),
  changePassword: (data: object) =>
    api.post('/auth/change-password', data),
  updateProfile: (data: object) =>
    api.put('/auth/profile', data),
}

// All other APIs same as before...
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
  dispense:        (data: object) => api.post('/dispensary/dispense', data),
  getHistory:      (params?: object) => api.get('/dispensary/history', { params }),
}
