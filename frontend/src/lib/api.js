import axios from 'axios';

// The app always talks to the API with relative URLs: in production Express
// serves the built frontend, and in development Vite proxies /api (vite.config.js).
axios.defaults.baseURL = '';

// Attach the session token to every request so callers don't have to.
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// A token the server no longer accepts ends the session everywhere.
axios.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const message = err.response?.data?.message;
    if (status === 401 || (status === 400 && message === 'Invalid token')) {
      window.dispatchEvent(new Event('auth:expired'));
    }
    return Promise.reject(err);
  }
);

export const apiError = (err, fallback = 'Something went wrong') => {
  const message = err?.response?.data?.message;
  if (!message) return err?.response ? fallback : 'Cannot reach the server. Check your connection.';
  if (/UNIQUE constraint failed: Users\.Email/i.test(message)) return 'An account with this email already exists.';
  if (/UNIQUE constraint failed: Users\.Username/i.test(message)) return 'That username is taken. Try another one.';
  return message;
};

export default axios;
