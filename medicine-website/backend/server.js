const dotenv = require("dotenv")
dotenv.config()

const connectDB = require("./config/db")
const seedMedicines = require("./config/seed")
const app = require("./app")

if (!process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET is not set. Refusing to start.")
  process.exit(1)
}

// Connect, then seed the starter catalogue into the DB so it's fully editable
connectDB().then(seedMedicines)

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
