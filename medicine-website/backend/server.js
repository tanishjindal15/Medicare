const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const dotenv = require("dotenv")

const connectDB = require("./config/db")
const seedMedicines = require("./config/seed")

dotenv.config()

if(!process.env.JWT_SECRET){
  console.error("FATAL: JWT_SECRET is not set. Refusing to start.")
  process.exit(1)
}

// Connect, then seed the starter catalogue into the DB so it's fully editable
connectDB().then(seedMedicines)

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
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) return cb(null, true)
    return cb(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true
}))
app.use(express.json())

/* ROUTES */

const authRoutes = require("./routes/authRoutes")
const medicineRoutes = require("./routes/medicineRoutes")
const orderRoutes = require("./routes/orderRoutes")
const addressRoutes = require("./routes/addressRoutes")
/* ROUTE MIDDLEWARE */

app.use("/api/auth", authRoutes)
app.use("/api/medicines", medicineRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/address", addressRoutes)
/* STATIC IMAGE FOLDER */

app.use("/uploads", express.static("uploads"))
const adminRoutes = require("./routes/adminRoutes")

app.use("/api/admin", adminRoutes)
/* TEST ROUTE */

app.get("/", (req,res)=>{
  res.send("Medicine API Running")
})

/* JSON ERROR HANDLER (catches multer errors, thrown errors, etc.) */
app.use((err, req, res, next)=>{
  console.error("Error:", err.message)
  const status = err.status || (err.code === "LIMIT_FILE_SIZE" ? 413 : 400)
  res.status(status).json({ message: err.message || "Something went wrong" })
})

/* SERVER */

const PORT = process.env.PORT || 5000

app.listen(PORT, ()=>{
  console.log(`Server running on port ${PORT}`)
})