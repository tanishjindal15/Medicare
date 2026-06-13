const test = require("node:test")
const assert = require("node:assert")
const mongoose = require("mongoose")
const request = require("supertest")
const bcrypt = require("bcryptjs")
const { MongoMemoryServer } = require("mongodb-memory-server")

// Must be set before requiring the app / middleware
process.env.NODE_ENV = "test"
process.env.JWT_SECRET = "test-secret"

// Stub email sending so no real emails go out during tests
const mailer = require("../config/mailer")
mailer.transporter.sendMail = async () => ({ messageId: "test" })

const app = require("../app")
const User = require("../models/User")

let mongo

test.before(async () => {
  mongo = await MongoMemoryServer.create()
  await mongoose.connect(mongo.getUri())
})

test.after(async () => {
  await mongoose.disconnect()
  await mongo.stop()
})

test("signup without a valid OTP is rejected (the bypass is closed)", async () => {
  const res = await request(app).post("/api/auth/signup").send({
    name: "Test User",
    email: "newuser@test.com",
    phone: "9876543210",
    password: "Abcd123!"
    // no otp
  })
  assert.strictEqual(res.status, 400)
  // and no account was created
  const exists = await User.findOne({ email: "newuser@test.com" })
  assert.strictEqual(exists, null)
})

test("signup with a weak password is rejected server-side", async () => {
  const res = await request(app).post("/api/auth/signup").send({
    name: "Test",
    email: "weak@test.com",
    phone: "9876543210",
    password: "weak"
  })
  assert.strictEqual(res.status, 400)
  assert.match(res.body.message, /password/i)
})

test("signup with an invalid phone is rejected server-side", async () => {
  const res = await request(app).post("/api/auth/signup").send({
    name: "Test",
    email: "phone@test.com",
    phone: "12345",
    password: "Abcd123!"
  })
  assert.strictEqual(res.status, 400)
  assert.match(res.body.message, /phone/i)
})

test("login with wrong credentials returns a generic message", async () => {
  const res = await request(app).post("/api/auth/login").send({
    email: "nobody@test.com",
    password: "whatever"
  })
  assert.strictEqual(res.status, 400)
  assert.strictEqual(res.body.message, "Invalid credentials")
})

test("forgot-password does not reveal whether an email exists (no enumeration)", async () => {
  const unknown = await request(app).post("/api/auth/forgot-password").send({ email: "ghost@test.com" })
  assert.strictEqual(unknown.status, 200)
  assert.match(unknown.body.message, /if that email/i)

  await User.create({
    name: "Known", email: "known@test.com", phone: "9876543210",
    password: await bcrypt.hash("Abcd123!", 10)
  })
  const known = await request(app).post("/api/auth/forgot-password").send({ email: "known@test.com" })
  // Same status + message whether or not the account exists
  assert.strictEqual(known.status, 200)
  assert.strictEqual(known.body.message, unknown.body.message)
})

test("reset-password locks the OTP after repeated wrong attempts", async () => {
  await User.create({
    name: "Reset", email: "reset@test.com", phone: "9876543210",
    password: await bcrypt.hash("Abcd123!", 10)
  })
  await request(app).post("/api/auth/forgot-password").send({ email: "reset@test.com" })

  let lastStatus
  for (let i = 0; i < 6; i++) {
    const res = await request(app).post("/api/auth/reset-password").send({
      email: "reset@test.com",
      otp: "000000",          // deliberately wrong
      newPassword: "Newpass1!"
    })
    lastStatus = res.status
  }
  // After 5 wrong tries the OTP is consumed/locked → 429
  assert.strictEqual(lastStatus, 429)
})
