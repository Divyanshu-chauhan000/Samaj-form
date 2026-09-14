// API Configuration for Admin Panel
// In production, this will use the environment variable set on Render
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== "undefined" &&
  window.location.origin === "http://localhost:3002"
    ? "http://localhost:5000"
    : "https://kumawat-samaj-backend.onrender.com");

// Frontend URL
const FORM_URL =
  import.meta.env.VITE_FORM_URL || "https://kumawat-samaj.onrender.com";

export { API_BASE_URL, FORM_URL };
