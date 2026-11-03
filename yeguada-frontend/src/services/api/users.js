// services/api/users.js — gestión de usuarios (solo admin)
import { request } from './client';

export const fetchUsers = () => request('/users');
export const createUser = (payload) => request('/users', { method: 'POST', body: payload });
export const updateUser = (id, payload) => request(`/users/${id}`, { method: 'PUT', body: payload });
export const deleteUser = (id) => request(`/users/${id}`, { method: 'DELETE' });
export const sendUserReset = (id) => request(`/users/${id}/send-reset`, { method: 'POST' });
