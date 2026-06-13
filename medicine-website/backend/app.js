const express = require("express")
const cors = require("cors")
const helmet = require("helmet")

const authRoutes = require("./routes/authRoutes")
const medicineRoutes = require("./routes/medicineRoutes")
const orderRoutes = require("./routes/orderRoutes")
const addressRoutes = require("./routes/addressRoutes")
const adminRoutes = require("./routes/adminRoutes")

/* Builds and returns the configured Express app (no DB connection, no listen),
   so it can be imported by tests with supertest. */
const app = express()

// Trust the hosting platform's proxy so rate limiting sees the real client IP
app.set("trust proxy", 1)

// Security headers. Allow uploaded images to be loaded by the frontend origin.
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}))

// CORS: allow any localhost port during development (Vite may switch ports),
// plus the configured production origin(s) in CLIENT_URL (comma-separated).
const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean)

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true)                              // curl / mobile apps / server-to-server
    if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return cb(null, true)  // any localhost port (dev)
    if (/^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) return cb(null, true)
    if (allowedOrigins.includes(origin)) return cb(null, true)
    // No production allowlist configured: allow in dev, but fail closed in production
    // so a forgotten CLIENT_URL never reflects arbitrary origins.
    if (allowedOrigins.length === 0 && process.env.NODE_ENV !== "production") return cb(null, true)
    return cb(new Error(`CORS: origin ${origin} not allowed`))
  }
  // No `credentials` — auth uses the Authorization header, not cookies
}))

app.use(express.json())

/* Lightweight request logging (method, path, status, duration); off in tests */
if (process.env.NODE_ENV !== "test") {
  app.use((req, res, next) => {
    const start = Date.now()
    res.on("finish", () => {
      console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`)
    })
    next()
  })
}

/* ROUTES */
app.use("/api/auth", authRoutes)
app.use("/api/medicines", medicineRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/address", addressRoutes)
app.use("/uploads", express.static("uploads"))
app.use("/api/admin", adminRoutes)

app.get("/", (req, res) => {
  res.send("Medicine API Running")
})

/* JSON ERROR HANDLER (catches multer errors, thrown errors, etc.) */
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error("Error:", err.message)

  // Only surface known, safe-to-show validation messages; never leak internals
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ message: "File too large (max 2 MB)" })
  }
  if (err.message && /only image files/i.test(err.message)) {
    return res.status(400).json({ message: err.message })
  }

  const status = err.status && err.status < 500 ? err.status : 500
  res.status(status).json({ message: "Something went wrong" })
})

module.exports = app
