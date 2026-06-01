// Все API-обёртки по ресурсам.
// Намеренно держим в одном файле - это просто маппинг URL,
// не имеет смысла дробить.
import { apiGet, apiPost, apiPut, apiDelete } from './client.js';

export const authApi = {
  register: (body) => apiPost('/auth/register', body),
  login: (body) => apiPost('/auth/login', body),
  refresh: (refresh_token) => apiPost('/auth/refresh', { refresh_token }),
  logout: () => apiPost('/auth/logout'),
  me: () => apiGet('/auth/me')
};

export const scheduleApi = {
  list: (params) => apiGet('/schedule', { params }),
  week: (params) => apiGet('/schedule/week', { params }),
  get: (id) => apiGet(`/schedule/${id}`),
  create: (body) => apiPost('/schedule', body),
  update: (id, body) => apiPut(`/schedule/${id}`, body),
  remove: (id) => apiDelete(`/schedule/${id}`)
};

export const bookingsApi = {
  create: (schedule_id, client_id = null) =>
    apiPost('/bookings', client_id ? { schedule_id, client_id } : { schedule_id }),
  cancel: (id) => apiDelete(`/bookings/${id}`),
  my: () => apiGet('/bookings/my'),
  all: (params) => apiGet('/bookings', { params })
};

export const membershipsApi = {
  types: () => apiGet('/memberships/types'),
  purchase: (body) => apiPost('/memberships', body),
  my: () => apiGet('/memberships/my'),
  get: (id) => apiGet(`/memberships/${id}`)
};

export const trainersApi = {
  list: (params) => apiGet('/trainers', { params }),
  get: (id) => apiGet(`/trainers/${id}`),
  schedule: (id) => apiGet(`/trainers/${id}/schedule`),
  reviews: (id) => apiGet(`/trainers/${id}/reviews`)
};

export const clientsApi = {
  list: (params) => apiGet('/clients', { params }),
  get: (id) => apiGet(`/clients/${id}`),
  update: (id, body) => apiPut(`/clients/${id}`, body),
  remove: (id) => apiDelete(`/clients/${id}`),
  bookings: (id) => apiGet(`/clients/${id}/bookings`),
  memberships: (id) => apiGet(`/clients/${id}/memberships`),
  achievements: (id) => apiGet(`/clients/${id}/achievements`),
  stats: (id) => apiGet(`/clients/${id}/stats`)
};

export const paymentsApi = {
  create: (body) => apiPost('/payments', body),
  my: () => apiGet('/payments/my'),
  all: (params) => apiGet('/payments', { params })
};

export const reviewsApi = {
  list: (params) => apiGet('/reviews', { params }),
  create: (body) => apiPost('/reviews', body),
  approve: (id) => apiPut(`/reviews/${id}/approve`),
  remove: (id) => apiDelete(`/reviews/${id}`),
  pending: () => apiGet('/reviews/pending')
};

export const supportApi = {
  rooms: () => apiGet('/support/rooms'),
  messages: (room_id) => apiGet(`/support/rooms/${room_id}/messages`),
  send: (room_id, body) => apiPost(`/support/rooms/${room_id}/message`, body)
};

export const achievementsApi = {
  create: (body) => apiPost('/achievements', body),
  byClient: (id) => apiGet(`/achievements/client/${id}`)
};

export const programsApi = {
  create: (body) => apiPost('/programs', body),
  my: () => apiGet('/programs/my'),
  get: (id) => apiGet(`/programs/${id}`),
  update: (id, body) => apiPut(`/programs/${id}`, body)
};

export const hallsApi = {
  list: () => apiGet('/halls'),
  get: (id) => apiGet(`/halls/${id}`),
  occupancy: (id, date) => apiGet(`/halls/${id}/occupancy`, { params: { date } }),
  create: (body) => apiPost('/halls', body),
  update: (id, body) => apiPut(`/halls/${id}`, body),
  remove: (id) => apiDelete(`/halls/${id}`)
};

export const analyticsApi = {
  dashboard: () => apiGet('/analytics/dashboard'),
  revenue: (period = 'month') => apiGet('/analytics/revenue', { params: { period } }),
  popular: () => apiGet('/analytics/popular-classes'),
  trainers: () => apiGet('/analytics/trainer-performance'),
  retention: () => apiGet('/analytics/member-retention')
};

export const notificationsApi = {
  my: () => apiGet('/notifications/my'),
  read: (id) => apiPut(`/notifications/${id}/read`),
  readAll: () => apiPut('/notifications/read-all'),
  remove: (id) => apiDelete(`/notifications/${id}`),
  create: (body) => apiPost('/notifications', body)
};
