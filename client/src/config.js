// API Configuration
// In production, this will use the environment variable set on Render
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== "undefined" &&
  window.location.origin === "http://localhost:3000"
    ? "http://localhost:5000"
    : "https://samaj-parichay-form.onrender.com");

export default API_BASE_URL;
