// index.js
import express from "express";
import mongoose from "mongoose";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import cors from "cors";
import userRouter from "./routes/users_routes.js";
import facilityRouter from "./routes/facility_routes.js";
import bookingRouter from "./routes/booking_routes.js";
import managerRouter from "./routes/manager_routes.js";


// Middlewares
import errorHandler from "./middlewares/errorhandling.js";


dotenv.config(); // Load environment variables
const app = express();



const allowedOrigins = [
  "http://localhost:5173",//Dev
  "https://ezbooki.netlify.app"
];




app.use (cors({origin:(origin,callback) =>{
  if(!origin || allowedOrigins.includes(origin)){
    callback(null,true);
  }else{
    callback(new Error("Not allowed by CORS"));

  }
},
credentials:true, 
}));


app.set('trust proxy', 1);

app.use(express.json());




app.use((req, res, next) => {
  console.log("🧾 Origin:", req.headers.origin);
  console.log("🛠  Method:", req.method, "→", req.originalUrl);
  next();
});
// Use routers
app.use("/api/user", userRouter);
app.use("/api/manager", managerRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/facility", facilityRouter);



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