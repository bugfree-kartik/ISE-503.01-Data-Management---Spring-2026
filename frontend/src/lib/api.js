// In dev, VITE_API_URL is empty so calls go to /api/* (proxied by Vite → localhost:3001).
// In production, set VITE_API_URL to your backend URL e.g. https://sbu-dining-api.onrender.com
const BASE = import.meta.env.VITE_API_URL ?? '';

const api = (path, init) => fetch(`${BASE}${path}`, init);

export default api;
