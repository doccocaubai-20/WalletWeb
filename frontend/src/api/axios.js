import axios from 'axios';

const instance = axios.create({
    baseURL: '', 
});

const AUTH_ENDPOINT_PATTERN = /\/api\/users\/(login|refresh-token|register|forgot-password|reset-password)$/;

const rememberApiError = (error, stage = 'response') => {
    try {
        const info = {
            stage,
            time: new Date().toISOString(),
            method: String(error?.config?.method || '').toUpperCase(),
            url: error?.config?.url || '',
            status: error?.response?.status || null,
            message: typeof error?.response?.data === 'string'
                ? error.response.data
                : error?.response?.data?.message || error?.message || 'Unknown error',
        };
        sessionStorage.setItem('lastApiError', JSON.stringify(info));
        // Keep a readable trace in console while debugging auth/network issues.
        console.error('[API_ERROR]', info);
    } catch {
        // Ignore logging issues to avoid breaking request flow.
    }
};

// Gắn Access Token vào header
instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

instance.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config || {};
        const requestUrl = String(originalRequest.url || '');

        rememberApiError(error, 'response');

        if (
            error.response &&
            error.response.status === 401 &&
            !originalRequest._retry &&
            !AUTH_ENDPOINT_PATTERN.test(requestUrl)
        ) {
            originalRequest._retry = true;
            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) {
                    return Promise.reject(error);
                }
                
                const response = await axios.post('/api/users/refresh-token', {
                    refreshToken: refreshToken
                });

                const newAccessToken = response.data.accessToken;
                
                localStorage.setItem('accessToken', newAccessToken);
                window.dispatchEvent(new Event('auth:changed'));
                
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return instance(originalRequest);

            } catch (refreshError) {
                rememberApiError(refreshError, 'refresh');
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('userRole');
                window.dispatchEvent(new Event('auth:changed'));
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default instance;