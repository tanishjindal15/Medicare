import axios from "axios"

// Backend origin. Set VITE_API_URL in .env / your host's env for production.
// Falls back to local dev server when unset.
export const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:5000"

const api = axios.create({
  baseURL: API_BASE
})

// Attach the JWT (if present) to every request automatically.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Helper for building image URLs served from the backend's /uploads folder.
export const imageUrl = (path) => (path ? `${API_BASE}${path}` : "")

// Inline SVG shown when a medicine image is missing or fails to load.
// Keeps cards/detail pages aligned instead of collapsing to a broken-image icon.
const PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 24 24"><rect width="24" height="24" fill="#eef2f8"/><g fill="none" stroke="#b9c4d6" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 20.5 20.5 10.5a5 5 0 0 0-7-7L3.5 13.5a5 5 0 0 0 7 7Z"/><path d="m8.5 8.5 7 7"/></g></svg>`

export const PLACEHOLDER_IMG = `data:image/svg+xml,${encodeURIComponent(PLACEHOLDER_SVG)}`

// onError handler: swap to placeholder once, without looping.
export const onImageError = (e) => {
  if (e.currentTarget.src !== PLACEHOLDER_IMG) {
    e.currentTarget.onerror = null
    e.currentTarget.src = PLACEHOLDER_IMG
  }
}

export default api
