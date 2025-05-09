import axios, { AxiosInstance } from 'axios';

const API: AxiosInstance = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/',
});

API.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("token")
      // Skip adding Authorization header for login and register endpoints
      if (token && config.url && !config.url.endsWith('/login/') && !config.url.endsWith('/register/')) {
        config.headers.Authorization = `Token ${token}`
      }
      return config
    },
    (error) => Promise.reject(error)
)
export default API;
