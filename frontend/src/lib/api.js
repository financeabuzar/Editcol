import axios from "axios";

export const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || "http://localhost:8000").trim().replace(/\/$/, "");
export const API_BASE = `${BACKEND_URL}/api`;
export const WS_URL = BACKEND_URL.replace(/^http/, "ws") + "/api/ws";

const api = axios.create({ baseURL: API_BASE, withCredentials: true });

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
