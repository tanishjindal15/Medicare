const express = require("express")
const router = express.Router()
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const crypto = require("crypto")
const User = require("../models/User")
const rateLimit = require("express-rate-limit")
const authMiddleware = require("../middleware/authMiddleware")
const { transporter } = require("../config/mailer")
const { isValidEmail, isValidPhone, isValidPassword, isNonEmpty, normalizeEmail } = require("../utils/validation")

/* RATE LIMITERS */

// Skip rate limiting in the test environment (so tests aren't throttled)
const skipInTest = () => process.env.NODE_ENV === "test"

// Login / OTP-verify / password-reset attempts: 10 per 15 min per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest
})

// OTP / email sending: 5 per 15 min per IP (prevents email spam)
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest
})

/* OTP STORE (in-memory; fine for a single instance) */
const otpStore = {}

const genOtp = () => crypto.randomInt(100000, 1000000)

/* Validate a submitted OTP against the store, with an attempt cap.
   Returns { ok } on success (caller deletes the entry), or { ok:false, status, message }. */
function checkOtp(email, otp) {
  const record = otpStore[email]
  if (!record) {
    return { ok: false, status: 400, message: "OTP not found. Please request a new one." }
  }
  if (Date.now() > record.expires) {
    delete otpStore[email]
    return { ok: false, status: 400, message: "OTP expired. Please request a new one." }
  }
  if ((record.attempts || 0) >= 5) {
    delete otpStore[email]
    return { ok: false, status: 429, message: "Too many incorrect attempts. Please request a new OTP." }
  }
  if (String(record.otp) !== String(otp)) {
    record.attempts = (record.attempts || 0) + 1
    return { ok: false, status: 400, message: "Invalid OTP" }
  }
  return { ok: true }
}

/* =========================
   SEND EMAIL OTP (signup)
========================= */

router.post("/send-email-otp", otpLimiter, async (req, res) => {

  const email = normalizeEmail(req.body.email)

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "Enter a valid email address" })
  }

  const otp = genOtp()
  otpStore[email] = { otp, expires: Date.now() + 5 * 60 * 1000, attempts: 0 }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Email OTP Verification",
      text: `Your OTP is ${otp}`
    })
    res.json({ message: "Email OTP sent" })
  } catch (err) {
    console.error("Email send error:", err.message)
    res.status(500).json({ message: "Could not send OTP email" })
  }

})

/* =========================
   SIGNUP (OTP authoritative)
========================= */

router.post("/signup", async (req, res) => {

  try {

    const name = (req.body.name || "").trim()
    const email = normalizeEmail(req.body.email)
    const phone = (req.body.phone || "").trim()
    const password = req.body.password || ""
    const otp = req.body.otp || req.body.emailOtp

    // Server-side validation (never trust the client)
    if (!isNonEmpty(name)) return res.status(400).json({ message: "Name is required" })
    if (!isValidEmail(email)) return res.status(400).json({ message: "Enter a valid email address" })
    if (!isValidPhone(phone)) return res.status(400).json({ message: "Enter a valid 10-digit phone number" })
    if (!isValidPassword(password)) {
      return res.status(400).json({ message: "Password must be 8+ chars with upper, lower, number & special character" })
    }

    // OTP must be valid and was sent to this email
    const otpResult = checkOtp(email, otp)
    if (!otpResult.ok) {
      return res.status(otpResult.status).json({ message: otpResult.message })
    }

    const userExists = await User.findOne({ email })
    if (userExists) {
      return res.status(400).json({ message: "User already exists" })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    await new User({ name, email, password: hashedPassword, phone }).save()

    delete otpStore[email] // consume the OTP

    res.json({ message: "Signup successful" })

  } catch (error) {
    res.status(500).json({ error: error.message })
  }

})

/* =========================
   FORGOT PASSWORD (no enumeration)
========================= */

router.post("/forgot-password", otpLimiter, async (req, res) => {

  const email = normalizeEmail(req.body.email)

  // Always respond the same way so attackers can't probe which emails exist
  const genericMsg = { message: "If that email is registered, an OTP has been sent." }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "Enter a valid email address" })
  }

  try {
    const user = await User.findOne({ email })
    if (!user) {
      return res.json(genericMsg)
    }

    const otp = genOtp()
    otpStore[email] = { otp, expires: Date.now() + 5 * 60 * 1000, attempts: 0 }

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Reset Password OTP",
      text: `Your OTP is ${otp}`
    })

    res.json(genericMsg)

  } catch (err) {
    console.error("Forgot-password error:", err.message)
    res.status(500).json({ message: "Error sending OTP" })
  }

})

/* =========================
   RESET PASSWORD
========================= */

router.post("/reset-password", loginLimiter, async (req, res) => {

  const email = normalizeEmail(req.body.email)
  const { otp, newPassword } = req.body

  try {

    if (!isValidPassword(newPassword || "")) {
      return res.status(400).json({ message: "Password must be 8+ chars with upper, lower, number & special character" })
    }

    const otpResult = checkOtp(email, otp)
    if (!otpResult.ok) {
      return res.status(otpResult.status).json({ message: otpResult.message })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await User.findOneAndUpdate({ email }, { password: hashedPassword })

    delete otpStore[email]

    res.json({ message: "Password updated successfully" })

  } catch (err) {
    res.status(500).json({ message: "Error resetting password" })
  }

})

/* =========================
   LOGIN
========================= */

router.post("/login", loginLimiter, async (req, res) => {

  const email = normalizeEmail(req.body.email)
  const { password } = req.body

  try {

    const user = await User.findOne({ email })

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    const isMatch = await bcrypt.compare(password || "", user.password)

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    )

    res.json({
      token,
      name: user.name,
      role: user.role,
      user: { id: user._id, email: user.email, phone: user.phone }
    })

  } catch (error) {
    res.status(500).json({ error: error.message })
  }

})

/* =========================
   DELETE ACCOUNT
========================= */

router.delete("/delete-account", authMiddleware, async (req, res) => {

  const { password } = req.body
  const userId = req.user.id

  try {

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    const isMatch = await bcrypt.compare(password || "", user.password)
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password" })
    }

    await User.findByIdAndDelete(userId)
    res.json({ message: "Account deleted successfully" })

  } catch (err) {
    res.status(500).json({ message: "Error deleting account" })
  }

})

/* =========================
   UPDATE PROFILE
========================= */

router.put("/update-profile", authMiddleware, async (req, res) => {

  const name = (req.body.name || "").trim()
  const phone = (req.body.phone || "").trim()
  const userId = req.user.id

  try {

    if (!isNonEmpty(name)) return res.status(400).json({ message: "Name is required" })
    if (!isValidPhone(phone)) return res.status(400).json({ message: "Enter a valid 10-digit phone number" })

    const user = await User.findByIdAndUpdate(
      userId,
      { name, phone },
      { new: true, runValidators: true }
    ).select("-password") // never return the password hash to the client

    res.json({ message: "Profile updated", user })

  } catch (err) {
    res.status(500).json({ message: "Update failed" })
  }

})

module.exports = router
