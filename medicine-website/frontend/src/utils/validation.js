/* Shared client-side validators. Each returns true when valid. */

export const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || "").trim())

// Indian mobile number: 10 digits starting 6-9
export const isValidPhone = (phone) =>
  /^[6-9]\d{9}$/.test((phone || "").trim())

// 6-digit Indian PIN code (cannot start with 0)
export const isValidPincode = (pincode) =>
  /^[1-9]\d{5}$/.test((pincode || "").trim())

// 8+ chars with lower, upper, digit and special char
export const isValidPassword = (password) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(password || "")

export const isRequired = (value) =>
  (value || "").toString().trim().length > 0

/* Validate a delivery address object; returns an { field: message } map */
export const validateAddress = (addr) => {
  const e = {}
  if (!isRequired(addr.name)) e.name = "Name is required"
  if (!isValidPhone(addr.phone)) e.phone = "Enter a valid 10-digit phone number"
  if (!isRequired(addr.street)) e.street = "Street is required"
  if (!isRequired(addr.city)) e.city = "City is required"
  if (!isRequired(addr.state)) e.state = "State is required"
  if (!isValidPincode(addr.pincode)) e.pincode = "Enter a valid 6-digit pincode"
  return e
}
