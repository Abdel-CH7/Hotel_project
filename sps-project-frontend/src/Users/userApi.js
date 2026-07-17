import apiClient from "../utils/apiClient";

export const listUsers = async (params) => (await apiClient.get("/users", { params })).data;
export const createUser = async (payload) => (await apiClient.post("/users", payload)).data;
export const updateUser = async (id, payload) => (await apiClient.put(`/users/${id}`, payload)).data;
export const updateUserStatus = async (id, isActive) => (
  await apiClient.patch(`/users/${id}/status`, { is_active: isActive })
).data;
export const resetUserPassword = async (id, payload) => (
  await apiClient.patch(`/users/${id}/reset-password`, payload)
).data;
