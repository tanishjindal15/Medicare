import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter, Routes, Route } from "react-router-dom"
import ProtectedRoute from "./ProtectedRoute"
import AuthProvider from "../context/AuthContext"

function renderAt(path) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<div>login page</div>} />
          <Route
            path="/secret"
            element={<ProtectedRoute><div>secret content</div></ProtectedRoute>}
          />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  )
}

describe("ProtectedRoute", () => {
  it("redirects to /login when there is no token", () => {
    localStorage.clear()
    renderAt("/secret")
    expect(screen.getByText("login page")).toBeInTheDocument()
  })

  it("renders the protected content when a token exists", () => {
    localStorage.setItem("token", "fake-token")
    renderAt("/secret")
    expect(screen.getByText("secret content")).toBeInTheDocument()
  })
})
