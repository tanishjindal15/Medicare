import { createContext, useContext, useState } from "react"

export const AuthContext = createContext()

const AUTH_KEYS = ["token", "name", "role", "userId", "email", "phone"]

function AuthProvider({ children }) {

  /* Initialise from localStorage so a refresh keeps the user signed in */
  const [auth, setAuth] = useState(() => ({
    token: localStorage.getItem("token") || "",
    name: localStorage.getItem("name") || "",
    role: localStorage.getItem("role") || "",
    userId: localStorage.getItem("userId") || "",
    email: localStorage.getItem("email") || "",
    phone: localStorage.getItem("phone") || ""
  }))

  /* Called after a successful login with the server response */
  const login = (data) => {
    const next = {
      token: data.token,
      name: data.name || "",
      role: data.role || "user",
      userId: data.user?.id || "",
      email: data.user?.email || "",
      phone: data.user?.phone || ""
    }
    localStorage.setItem("token", next.token)
    localStorage.setItem("name", next.name)
    localStorage.setItem("role", next.role)
    localStorage.setItem("userId", next.userId)
    localStorage.setItem("email", next.email)
    localStorage.setItem("phone", next.phone)
    setAuth(next)
  }

  /* Clears auth only — the cart is intentionally preserved */
  const logout = () => {
    AUTH_KEYS.forEach(k => localStorage.removeItem(k))
    setAuth({ token: "", name: "", role: "", userId: "", email: "", phone: "" })
  }

  /* Update editable profile fields (name / phone) */
  const updateUser = (patch) => {
    setAuth(prev => {
      const next = { ...prev, ...patch }
      if (patch.name !== undefined) localStorage.setItem("name", patch.name)
      if (patch.phone !== undefined) localStorage.setItem("phone", patch.phone)
      return next
    })
  }

  const isLoggedIn = Boolean(auth.token)
  const isAdmin = auth.role === "admin"

  return (
    <AuthContext.Provider value={{ ...auth, isLoggedIn, isAdmin, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

export default AuthProvider
