import axios from "axios";
import { jwtDecode } from "jwt-decode";

const isDevelopment = import.meta.env.DEV;

const API_URL = isDevelopment
  ? import.meta.env.VITE_API_URL_DEV
  : import.meta.env.VITE_API_URL_PROD;

export const MEDIA_BASE_URL = isDevelopment
  ? import.meta.env.VITE_MEDIA_URL_DEV
  : import.meta.env.VITE_MEDIA_URL_PROD;

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access");
    if (token) {
      const decoded = jwtDecode(token);
      const expiry_date = decoded.exp;
      const current_time = Date.now() / 1000;

      if (expiry_date > current_time) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        // Handle token expiration
        localStorage.removeItem("access");
        window.location.href = "/login";
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
