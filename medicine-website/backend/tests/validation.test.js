const test = require("node:test")
const assert = require("node:assert")
const { isValidEmail, isValidPhone, isValidPassword, isNonEmpty, normalizeEmail } = require("../utils/validation")

test("isValidEmail accepts valid, rejects invalid", () => {
  assert.ok(isValidEmail("a@b.com"))
  assert.ok(isValidEmail("user.name@sub.domain.co"))
  assert.ok(!isValidEmail("nope"))
  assert.ok(!isValidEmail("a@b"))
  assert.ok(!isValidEmail("a b@c.com"))
  assert.ok(!isValidEmail(""))
})

test("isValidPhone enforces Indian 10-digit starting 6-9", () => {
  assert.ok(isValidPhone("9876543210"))
  assert.ok(isValidPhone("6000000000"))
  assert.ok(!isValidPhone("1234567890")) // starts with 1
  assert.ok(!isValidPhone("5876543210")) // starts with 5
  assert.ok(!isValidPhone("98765"))       // too short
  assert.ok(!isValidPhone("98765432101")) // too long
  assert.ok(!isValidPhone(""))
})

test("isValidPassword enforces strength rules", () => {
  assert.ok(isValidPassword("Abcd123!"))     // valid
  assert.ok(!isValidPassword("abc"))          // too short
  assert.ok(!isValidPassword("abcdefg1!"))    // no uppercase
  assert.ok(!isValidPassword("ABCDEFG1!"))    // no lowercase
  assert.ok(!isValidPassword("Abcdefgh!"))    // no digit
  assert.ok(!isValidPassword("Abcdefg12"))    // no special char
  assert.ok(!isValidPassword(""))
})

test("normalizeEmail lowercases and trims", () => {
  assert.strictEqual(normalizeEmail("  A@B.COM "), "a@b.com")
  assert.strictEqual(normalizeEmail("User@Example.com"), "user@example.com")
  assert.strictEqual(normalizeEmail(undefined), "")
})

test("isNonEmpty rejects blank strings", () => {
  assert.ok(isNonEmpty("x"))
  assert.ok(!isNonEmpty("   "))
  assert.ok(!isNonEmpty(""))
  assert.ok(!isNonEmpty(undefined))
})
