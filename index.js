// index.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";

// Routes
import userRouter from "./routes/users_routes.js";
import facilityRouter from "./routes/facility_routes.js";
import bookingRouter from "./routes/booking_routes.js";

// Middlewares
import errorHandler from "./middlewares/errorhandling.js";

dotenv.config(); // Load environment variables

const app = express();
app.use(express.json());

// Use routers
app.use("/api/user", userRouter);
app.use("/api/facility", facilityRouter);
app.use("/api/bookings", bookingRouter);

// Error handling middleware (last)
app.use(errorHandler);

// Dynamic port for Render
const PORT = process.env.PORT || 5000;

// Async function to connect and start the server
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    app.listen(PORT, () => {
      console.log(` Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error(" MongoDB Connection Error:", err);
  }
};

startServer();