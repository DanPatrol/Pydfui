// API Configuration
// Try to get URL from localStorage (set by fetch-api-url.js)
// Fallback to environment variable or default
const storedApiUrl = typeof window !== 'undefined' ? localStorage.getItem('PDF_API_URL') : null;
export const API_BASE_URL = storedApiUrl || import.meta.env.VITE_API_URL || 'https://pydf-api.vercel.app';
