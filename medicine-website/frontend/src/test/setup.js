import "@testing-library/jest-dom"
import { afterEach } from "vitest"
import { cleanup } from "@testing-library/react"

// Reset DOM + storage between tests
afterEach(() => {
  cleanup()
  localStorage.clear()
})
