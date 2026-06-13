/* Server-side validators — mirror the frontend rules so the API can't be
   bypassed by calling it directly (curl/Postman). */

const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim())

// Indian 10-digit mobile starting 6-9
const isValidPhone = (phone) =>
  /^[6-9]\d{9}$/.test(String(phone || "").trim())

// 8+ chars with upper, lower, number and special character
const isValidPassword = (pw) => {
  const p = String(pw || "")
  return (
    p.length >= 8 &&
    /[a-z]/.test(p) &&
    /[A-Z]/.test(p) &&
    /\d/.test(p) &&
    /[^A-Za-z0-9]/.test(p)
  )
}

const isNonEmpty = (s) => typeof s === "string" && s.trim().length > 0

const normalizeEmail = (email) => String(email || "").trim().toLowerCase()

module.exports = { isValidEmail, isValidPhone, isValidPassword, isNonEmpty, normalizeEmail }
