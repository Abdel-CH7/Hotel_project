import apiClient from "./apiClient";

let userRequest = null;

const authService = {
  async login(email, password) {
    const response = await apiClient.post("/login", { email, password });
    return response.data;
  },

  async logout() {
    const response = await apiClient.post("/logout");
    return response.data;
  },

  async getUser() {
    if (!userRequest) {
      userRequest = apiClient.get("/user")
        .then((response) => response.data)
        .finally(() => {
          userRequest = null;
        });
    }
    return userRequest;
  },
};

export default authService;
