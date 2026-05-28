import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000
});

// Хелперы для токенов
const TOKEN_KEY = 'volt_access';
const REFRESH_KEY = 'volt_refresh';

export const tokenStore = {
  getAccess: () => localStorage.getItem(TOKEN_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  set: (access, refresh) => {
    if (access) localStorage.setItem(TOKEN_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  }
};

// Подставляем access в каждый запрос
apiClient.interceptors.request.use((config) => {
  const token = tokenStore.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// При 401 - пытаемся refresh, потом ретраим запрос ОДИН раз
let refreshing = null;
apiClient.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retried) {
      original._retried = true;
      try {
        if (!refreshing) {
          const refresh = tokenStore.getRefresh();
          if (!refresh) throw new Error('No refresh token');
          refreshing = axios.post(`${BASE_URL}/auth/refresh`, { refresh_token: refresh });
        }
        const { data } = await refreshing;
        refreshing = null;
        if (data?.success && data?.data?.access_token) {
          tokenStore.set(data.data.access_token, data.data.refresh_token);
          original.headers.Authorization = `Bearer ${data.data.access_token}`;
          return apiClient(original);
        }
        throw new Error('Refresh failed');
      } catch (e) {
        refreshing = null;
        tokenStore.clear();
        // Сообщаем приложению, что нужно перелогиниться
        window.dispatchEvent(new CustomEvent('volt:logout'));
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

// Удобная обёртка - возвращает data сразу (или бросает)
export const apiGet = (url, config) => apiClient.get(url, config).then((r) => r.data);
export const apiPost = (url, body, config) => apiClient.post(url, body, config).then((r) => r.data);
export const apiPut = (url, body, config) => apiClient.put(url, body, config).then((r) => r.data);
export const apiDelete = (url, config) => apiClient.delete(url, config).then((r) => r.data);
