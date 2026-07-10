import axios from "axios";

export const BACKEND_URL = process.env.REACT_APP_API_URL || "https://api.editcol.com";
export const API_BASE = `${BACKEND_URL}/api`;
export const WS_URL = BACKEND_URL.replace(/^http/, "ws") + "/api/ws";

const api = axios.create({ baseURL: API_BASE, withCredentials: true });
const GENERIC_ERROR = "Something went wrong. Please try again.";
const GENERIC_NETWORK_ERROR = "We could not connect to EditCol. Check your connection and try again.";
const GENERIC_VALIDATION_ERROR = "Check your input and try again.";
const GENERIC_SERVER_ERROR = "We could not complete that request right now. Please try again.";

const UNSAFE_ERROR_PATTERNS = [
  /traceback/i,
  /\bfile\s+"/i,
  /\bline\s+\d+/i,
  /\b(?:[a-z]:\\|\/(?:app|users|home|var|tmp)\/)/i,
  /site-packages|node_modules/i,
  /mongodb|pymongo|e11000|duplicate key|objectid/i,
  /sql|database error|stack/i,
  /<[^>]+>/,
  /^\s*[{[]/,
];

function isSafePublicMessage(message) {
  if (typeof message !== "string") return false;
  const trimmed = message.trim();
  if (!trimmed || trimmed.length > 240) return false;
  return !UNSAFE_ERROR_PATTERNS.some((pattern) => pattern.test(trimmed));
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("editcol_access_token");
  if (token && !config.headers?.Authorization) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (response.data?.access_token) {
      localStorage.setItem("editcol_access_token", response.data.access_token);
    }
    return response;
  },
  (error) => {
    const status = error?.response?.status;
    if ((status === 401 || status === 403) && window.location.pathname !== "/login") {
      localStorage.removeItem("editcol_access_token");
      window.location.assign(`/login?from=${encodeURIComponent(window.location.pathname)}`);
    }
    return Promise.reject(error);
  }
);

export function formatApiError(err) {
  if (err?.message === "Network Error") {
    return GENERIC_NETWORK_ERROR;
  }

  const status = err?.response?.status;
  if (status === 422) return GENERIC_VALIDATION_ERROR;
  if (status >= 500) return GENERIC_SERVER_ERROR;

  const detail = err?.response?.data?.detail;
  if (isSafePublicMessage(detail)) return detail.trim();
  if (isSafePublicMessage(detail?.msg)) return detail.msg.trim();
  if (isSafePublicMessage(err?.message) && !err?.response) return err.message.trim();
  return GENERIC_ERROR;
}

export default api;
