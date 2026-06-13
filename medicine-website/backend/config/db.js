const mongoose = require("mongoose")

const connectDB = async () => {

  // Log runtime connection issues (mongoose auto-reconnects by default)
  mongoose.connection.on("error", (err) => console.error("MongoDB error:", err.message))
  mongoose.connection.on("disconnected", () => console.warn("MongoDB disconnected — retrying..."))
  mongoose.connection.on("reconnected", () => console.log("MongoDB reconnected"))

  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log("MongoDB Connected")
  } catch (error) {
    console.error("Initial MongoDB connection failed:", error.message)
    process.exit(1)
  }
}

module.exports = connectDB