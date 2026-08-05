import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { editPoster } from "./routes/editPoster"

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Configure CORS
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim())
  : ["http://localhost:3000"]

app.use(cors({
  origin: corsOrigins,
  credentials: true,
}))

// Middleware
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "poster-editing-backend" })
})

// API routes
app.post("/api/edit-poster", editPoster)

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Error:", err)
  res.status(500).json({ success: false, error: "Internal server error" })
})

// Start server
app.listen(PORT, () => {
  console.log(`Poster Editing Backend running on port ${PORT}`)
  console.log(`CORS origins: ${corsOrigins.join(", ")}`)
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`)
})
