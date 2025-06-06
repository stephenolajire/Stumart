import axios from "axios";
import { jwtDecode } from "jwt-decode";

const isDevelopment = import.meta.env.DEV;

const API_URL = isDevelopment
  ? import.meta.env.VITE_API_URL_DEV
  : import.meta.env.VITE_API_URL_PROD;

export const MEDIA_BASE_URL = isDevelopment
  ? import.meta.env.VITE_MEDIA_URL_DEV
  : import.meta.env.VITE_MEDIA_URL_PROD;


// Create axios instance with authentication header
const api = axios.create({
  baseURL:API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add authentication token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Only try to refresh token if we actually have one
      const refreshToken = localStorage.getItem("refresh");
      if (!refreshToken) {
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(`${API_URL}/token/refresh/`, {
          refresh: refreshToken,
        });

        if (res.status === 200) {
          localStorage.setItem("access", res.data.access);
          originalRequest.headers["Authorization"] = `Bearer ${res.data.access}`;
          return axios(originalRequest);
        }
      } catch (refreshError) {
        // Only redirect to login if token refresh actually failed
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;