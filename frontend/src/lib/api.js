import axios from "axios";

export const BACKEND_URL = process.env.REACT_APP_API_URL || "https://api.editcol.com";
export const API_BASE = `${BACKEND_URL}/api`;
export const WS_URL = BACKEND_URL.replace(/^http/, "ws") + "/api/ws";

const api = axios.create({ baseURL: API_BASE, withCredentials: true });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("editcol_access_token");
  if (token && !config.headers?.Authorization) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use((response) => {
  if (response.data?.access_token) {
    localStorage.setItem("editcol_access_token", response.data.access_token);
  }
  return response;
});

export function formatApiError(err) {
  if (err?.message === "Network Error") {
    return `Cannot connect to the backend at ${API_BASE}. Start the backend server and try again.`;
  }

  const detail = err?.response?.data?.detail;
  if (detail == null) return err?.message || "Something went wrong";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).join(" ");
  if (detail?.msg) return detail.msg;
  return String(detail);
}

export default api;
