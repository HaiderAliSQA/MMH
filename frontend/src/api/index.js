import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    timeout: 10000,
});

// ── Request Interceptor — attach JWT token ───────────────
api.interceptors.request.use(
    (config) => {
        const user = localStorage.getItem('user');
        if (user) {
            try {
                const parsed = JSON.parse(user);
                if (parsed.token) {
                    config.headers.Authorization = `Bearer ${parsed.token}`;
                }
            } catch {}
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ── Response Interceptor — handle 401 / errors ──────────
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
