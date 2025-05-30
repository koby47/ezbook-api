// index.js
import express from "express";
import mongoose from "mongoose";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config(); // Load environment variables

// Routes
import userRouter from "./routes/users_routes.js";
import facilityRouter from "./routes/facility_routes.js";
import bookingRouter from "./routes/booking_routes.js";

// Middlewares
import errorHandler from "./middlewares/errorhandling.js";



const allowedOrigins = [
  "http://localhost:5173",//Dev
  "https://ezbooki.netlify.app"
];



const app = express();
app.use (cors({origin:(origin,callback) =>{
  if(!origin || allowedOrigins.includes(origin)){
    callback(null,true);
  }else{
    callback(new Error("Not allowed by CORS"));

  }
},
credentials:true
}));



app.use(express.json());

app.set('trust proxy', 1);

// Use routers
app.use("/api/user", userRouter);
app.use("/api/facility", facilityRouter);
app.use("/api/bookings", bookingRouter);

// Error handling middleware (last)
app.use(errorHandler);

//Rate limiter
const limiter = rateLimit({windowMs:15 * 60 * 1000,//15 minutes
  max: 100,// Max 100 requests per IP
  messag:"Too many requests from this IP,please try again later."
  });
 
app.use(limiter);



// Dynamic port for Render
const PORT = process.env.PORT || 10000;

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