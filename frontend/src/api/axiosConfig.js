import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

// Restore token from localStorage on module load so it persists
// across page reloads and mobile browser sessions.
const savedToken = localStorage.getItem('token');
if (savedToken) {
  setAuthToken(savedToken);
}

export default api;
