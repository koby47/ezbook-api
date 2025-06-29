import express from "express";
import {
  createBooking,
  getBookings,
  updateBookingStatus,
  deleteBooking,
  getMyBookings,
  exportMyBookingsToPDF,userUpdateBooking
} from '../controllers/booking_controllers.js';

import { authenticate, authorize } from "../middlewares/auth.js";

const router = express.Router();

router.post("/", authenticate, createBooking);
router.get("/", authenticate, authorize(["manager","admin"]),getBookings);
router.get("/mine", authenticate, getMyBookings);//normal user
router.put("/:id", authenticate, authorize(["manager"]), updateBookingStatus);
router.delete("/:id", authenticate, authorize(["manager"]), deleteBooking);
router.get("/mine/pdf", authenticate, exportMyBookingsToPDF);
router.patch("/user/:id", authenticate, userUpdateBooking);//normal user update


export default router;
// This code defines an Express router for managing bookings.
// It imports the necessary functions from the controllers and middlewares.
// It sets up four routes:
// - POST /: Calls the createBooking function to handle creating a new booking.
// - GET /: Calls the getBookings function to retrieve all bookings.
// - PUT /:id: Calls the updateBookingStatus function to update the status of an existing booking by ID.
// - DELETE /:id: Calls the deleteBooking function to delete a booking by ID.
// The router uses middleware for authentication and role checking,
// ensuring that only authenticated users can create bookings,
// and only users with the 'manager' role can update or delete bookings.
// The router is then exported for use in the main application.

