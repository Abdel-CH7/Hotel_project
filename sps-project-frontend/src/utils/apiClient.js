import axios from "axios";

export const AUTH_TOKEN_KEY = "API_TOKEN";
export const AUTH_STATE_KEY = "isAuthenticated";
export const AUTH_UNAUTHORIZED_EVENT = "app:auth-unauthorized";
export const AUTH_REDIRECT_MESSAGE_KEY = "app:auth-message";

const LEGACY_TOKEN_KEY = "token";
const INVALID_TOKEN_VALUES = new Set(["", "null", "undefined"]);
const API_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

const normalizeToken = (value) => {
  const token = typeof value === "string" ? value.trim() : "";
  return INVALID_TOKEN_VALUES.has(token.toLowerCase()) ? "" : token;
};

export const getStoredAuthToken = () => {
  try {
    return normalizeToken(localStorage.getItem(AUTH_TOKEN_KEY));
  } catch {
    return "";
  }
};

export const storeAuthentication = (token) => {
  const normalized = normalizeToken(token);
  if (!normalized) throw new Error("Le jeton d’authentification reçu est invalide.");

  localStorage.setItem(AUTH_TOKEN_KEY, normalized);
  localStorage.setItem(AUTH_STATE_KEY, "true");
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  redirectingToLogin = false;
  return normalized;
};

export const clearStoredAuthentication = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_STATE_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
};

export const migrateLegacyAuthentication = () => {
  const current = getStoredAuthToken();
  if (current) {
    localStorage.setItem(AUTH_STATE_KEY, "true");
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    return current;
  }

  const legacy = normalizeToken(localStorage.getItem(LEGACY_TOKEN_KEY));
  if (legacy) return storeAuthentication(legacy);

  clearStoredAuthentication();
  return "";
};

const apiClient = axios.create({ baseURL: API_URL });
let redirectingToLogin = false;

const isLoginRequest = (config) => /(^|\/)login(?:\?|$)/.test(String(config?.url || ""));

const attachToken = (config) => {
  const token = getStoredAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (typeof config.headers?.delete === "function") {
    config.headers.delete("Authorization");
  } else if (config.headers) {
    delete config.headers.Authorization;
  }
  return config;
};

const handleResponseError = (error) => {
  const accountInactive = error.response?.status === 403
    && error.response?.data?.code === "account_inactive";

  if ((error.response?.status === 401 || accountInactive) && !isLoginRequest(error.config)) {
    clearStoredAuthentication();

    if (accountInactive && typeof window !== "undefined") {
      window.sessionStorage.setItem(AUTH_REDIRECT_MESSAGE_KEY, error.response.data.message);
    }

    if (typeof window !== "undefined" && !redirectingToLogin) {
      redirectingToLogin = true;
      window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }
  }

  return Promise.reject(error);
};

const installAuthInterceptors = (client) => {
  client.interceptors.request.use(attachToken);
  client.interceptors.response.use((response) => response, handleResponseError);
};

installAuthInterceptors(apiClient);
installAuthInterceptors(axios);

export default apiClient;
