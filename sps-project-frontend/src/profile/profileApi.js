import apiClient from "../utils/apiClient";

export const updateProfile = async (payload) => (await apiClient.put("/profile", payload)).data;
export const updateProfilePassword = async (payload) => (
  await apiClient.put("/profile/password", payload)
).data;
export const uploadProfilePhoto = async (photo) => {
  const body = new FormData();
  body.append("photo", photo);
  return (await apiClient.post("/profile/photo", body)).data;
};
export const removeProfilePhoto = async () => (await apiClient.delete("/profile/photo")).data;
