// services/api/auth.js
import { request } from './client';

export const fetchAuthStatus = () => request('/auth/status', { errorLabel: 'auth/status' });
export const login = (email, password) => request('/auth/login', { method: 'POST', body: { email, password } });
export const setupAdmin = (payload) => request('/auth/setup', { method: 'POST', body: payload });
export const logout = () => request('/auth/logout', { method: 'POST' });
export const forgotPassword = (email) => request('/auth/forgot-password', { method: 'POST', body: { email } });
export const validateResetToken = (token) => request(`/auth/reset-password/${encodeURIComponent(token)}`);
export const resetPassword = (token, password) => request('/auth/reset-password', { method: 'POST', body: { token, password } });
export const changePassword = (currentPassword, newPassword) =>
  request('/auth/change-password', { method: 'POST', body: { currentPassword, newPassword } });
