import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
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
  create:   (data: object) => api.post('/opd', data),
  updateStatus: (id: string, status: string) =>
    api.put(`/opd/${id}/status`, { status }),
}

export const admissionAPI = {
  getAll:    () => api.get('/admissions'),
  create:    (data: object) => api.post('/admissions', data),
  discharge: (id: string) => api.put(`/admissions/${id}/discharge`),
}

export const labAPI = {
  getAll:        (status?: string) =>
    api.get('/lab', { params: status ? { status } : {} }),
  create:        (data: object) => api.post('/lab', data),
  updateStatus:  (id: string, status: string) =>
    api.put(`/lab/${id}/status`, { status }),
  updateResults: (id: string, results: object[]) =>
    api.put(`/lab/${id}/results`, { results }),
}

export const pharmacyAPI = {
  getMedicines:   () => api.get('/medicines'),
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
  getUsers:     () => api.get('/admin/users'),
  createUser:   (data: object) => api.post('/admin/users', data),
  updateUser:   (id: string, data: object) =>
    api.put(`/admin/users/${id}`, data),
  getDoctors:   () => api.get('/admin/doctors'),
  createDoctor: (data: object) => api.post('/admin/doctors', data),
  updateDoctor: (id: string, data: object) =>
    api.put(`/admin/doctors/${id}`, data),
  getWards:     () => api.get('/admin/wards'),
  getBeds:      (wardId: string) =>
    api.get(`/admin/wards/${wardId}/beds`),
}
