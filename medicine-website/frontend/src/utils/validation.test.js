import { describe, it, expect } from "vitest"
import { isValidEmail, isValidPhone, isValidPincode, isValidPassword, isRequired, validateAddress } from "./validation"

describe("validation helpers", () => {
  it("validates email", () => {
    expect(isValidEmail("a@b.com")).toBe(true)
    expect(isValidEmail("nope")).toBe(false)
    expect(isValidEmail("")).toBe(false)
  })

  it("validates Indian phone (10 digits, starts 6-9)", () => {
    expect(isValidPhone("9876543210")).toBe(true)
    expect(isValidPhone("1234567890")).toBe(false)
    expect(isValidPhone("98765")).toBe(false)
  })

  it("validates pincode", () => {
    expect(isValidPincode("123456")).toBe(true)
    expect(isValidPincode("012345")).toBe(false)
    expect(isValidPincode("12345")).toBe(false)
  })

  it("validates password strength", () => {
    expect(isValidPassword("Abcd123!")).toBe(true)
    expect(isValidPassword("weak")).toBe(false)
    expect(isValidPassword("abcdefg1!")).toBe(false) // no uppercase
  })

  it("isRequired rejects blank", () => {
    expect(isRequired("x")).toBe(true)
    expect(isRequired("   ")).toBe(false)
  })

  it("validateAddress returns errors for an empty address and none for a valid one", () => {
    const empty = validateAddress({})
    expect(Object.keys(empty).length).toBeGreaterThan(0)

    const ok = validateAddress({
      name: "A", phone: "9876543210", street: "1 St", city: "City", state: "ST", pincode: "123456"
    })
    expect(Object.keys(ok).length).toBe(0)
  })
})
