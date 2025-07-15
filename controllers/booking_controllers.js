import { BookingModel } from "../models/booking_models.js";
import { bookingValidator } from "../validators/booking_validators.js";
import { sendEmail } from "../utils/sendEmails.js";
import mongoose from "mongoose";
import PDFDocument from "pdfkit";

// // 

export const createBooking = async (req, res) => {
  try {
    // Validate request body with Joi
    const { error, value } = bookingValidator.validate(req.body, { abortEarly: false });

    if (error) {
      return res.status(422).json({ errors: error.details.map(e => e.message) });
    }

    // Validate ObjectId format
    if (
      !mongoose.Types.ObjectId.isValid(value.userId) ||
      !mongoose.Types.ObjectId.isValid(value.facilityId)
    ) {
      return res.status(400).json({ error: "Invalid userId or facilityId" });
    }

    // Save booking
    const booking = await BookingModel.create(value);
    console.log("Booking saved:", booking._id);

    // Populate user info from userId
    const populatedBooking = await BookingModel.findById(booking._id).populate("userId");

    if (populatedBooking?.userId?.email) {
      const user = populatedBooking.userId;

      console.log("Sending email to:", user.email);

      try {
        await sendEmail({
          to: user.email,
          subject: "EzBook Booking Confirmation",
          text: `Hi ${user.userName}, your booking has been confirmed!`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; border-radius: 8px;">
              <h2> Booking Confirmed</h2>
              <p>Hello <strong>${user.userName}</strong>,</p>
              <p>Your booking has been successfully confirmed for:</p>
              <ul>
                <li><strong>Date:</strong> ${value.date}</li>
                <li><strong>Time:</strong> ${value.time}</li>
                <li><strong>Package:</strong> ${value.package}</li>
              </ul>
              <p>We’ll see you soon!</p>
              <p style="color: #888;">– The EzBook Team</p>
            </div>
          `
        });

        console.log("Email sent successfully.");
      } catch (emailErr) {
        console.error(" Email send failed:", emailErr.message);
      }
    } else {
      console.warn(" Could not find user email for confirmation.");
    }

    res.status(201).json({ message: "Booking created", booking });

  } catch (err) {
    console.error(" Booking Error:", err.message);
    res.status(500).json({ error: "Error creating booking" });
  }
};

export const getBookings = async (req, res) => {
  try {
    const { filter = "{}", sort = "{}" } = req.query;
    const bookings = await BookingModel.find(JSON.parse(filter))
      .sort(JSON.parse(sort))
      .populate("userId", "userName email") // ✅ populate user details
      .populate("facilityId", "name location"); // ✅ populate facility details

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: "Error fetching bookings" });
  }
};




export const getMyBookings = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      page = 1,
      limit = 5
    } = req.query;

    const skip = (page - 1) * parseInt(limit);
    let filter = {};
    let bookings;

    // 🧑‍💼 Manager
    if (req.user.role === "manager") {
      bookings = await BookingModel.find()
        .populate({
          path: "facilityId",
          select: "name location price createdBy",
          match: { createdBy: req.user._id }
        })
        .populate("userId", "userName email")
        .sort({ date: -1 });

      // Filter out bookings not related to their facilities
      bookings = bookings.filter(b => b.facilityId !== null);

      // Filter by date (optional)
      if (startDate || endDate) {
        bookings = bookings.filter(b => {
          const bookingDate = new Date(b.date);
          if (startDate && bookingDate < new Date(startDate)) return false;
          if (endDate && bookingDate > new Date(endDate)) return false;
          return true;
        });
      }

      const paginated = bookings.slice(skip, skip + parseInt(limit));
      return res.status(200).json({
        total: bookings.length,
        page: parseInt(page),
        count: paginated.length,
        bookings: paginated
      });
    }

    // 🛡 Admin → See ALL bookings
    if (req.user.role === "admin") {
      if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = new Date(startDate);
        if (endDate) filter.date.$lte = new Date(endDate);
      }

      bookings = await BookingModel.find(filter)
        .populate("facilityId", "name location price createdBy")
        .populate("userId", "userName email")
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await BookingModel.countDocuments(filter);
      return res.status(200).json({
        total,
        page: parseInt(page),
        count: bookings.length,
        bookings
      });
    }

    // 🧍‍♂️ Regular User
    filter.userId = new mongoose.Types.ObjectId(req.user.userId); // ✅ Convert to ObjectId

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    console.log("🔍 Filtering bookings for userId:", filter.userId); // ✅ Debug log

    bookings = await BookingModel.find(filter)
      .populate("facilityId", "name location price")
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await BookingModel.countDocuments(filter);

    return res.status(200).json({
      total,
      page: parseInt(page),
      count: bookings.length,
      bookings
    });

  } catch (err) {
    console.error("Get My Bookings Error:", err.message);
    return res.status(500).json({ error: "Error fetching your bookings" });
  }
};



export const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["approved", "cancelled"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    // 👇 Populate user and facility with createdBy field
    const booking = await BookingModel.findById(req.params.id)
      .populate("userId", "userName email")
      .populate("facilityId", "name createdBy");

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Restrict manager from updating other managers’ bookings
    if (
      req.user.role === "manager" &&
      String(booking.facilityId.createdBy) !== String(req.user._id)
    ) {
      return res.status(403).json({
        error: "Forbidden: You can only update bookings for your own facilities"
      });
    }

    // Update status
    booking.status = status;
    await booking.save();

    // Send status update email
    try {
      await sendEmail({
        to: booking.userId.email,
        subject: `Your EzBook Booking was ${status}`,
        html: `
          <div style="font-family: Arial; padding: 20px;">
            <h3>Hi ${booking.userId.userName},</h3>
            <p>Your booking for <strong>${booking.facilityId.name}</strong> has been <strong>${status.toUpperCase()}</strong>.</p>
            <p>Thank you for using EzBook!</p>
          </div>
        `
      });

      console.log(`Email sent for ${status} status`);
    } catch (err) {
      console.error("Email failed:", err.message);
    }

    res.status(200).json({ message: `Booking ${status}`, booking });

  } catch (err) {
    console.error("Booking Status Error:", err.message);
    res.status(500).json({ error: "Error updating booking status" });
  }
};

// PATCH /api/bookings/user/:id
export const userUpdateBooking = async (req, res) => {
  try {
    const { status, date, startTime, endTime, package: pkg } = req.body;

    // Validate allowed status
    if (status && !["cancelled"].includes(status)) {
      return res.status(400).json({ error: "Users can only cancel their bookings" });
    }

    const booking = await BookingModel.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    
    if (String(booking.userId) !== String(req.user.userId)) {
      return res.status(403).json({ error: "You can only modify your own bookings" });
    }

    // Only allow update if status is still pending
    if (booking.status !== "pending") {
      return res.status(400).json({ error: "Only pending bookings can be updated" });
    }

    // Apply updates
    if (status) booking.status = status;
    if (date) booking.date = date;
    if (startTime) booking.startTime = startTime;
    if (endTime) booking.endTime = endTime;
    if (pkg !== undefined) booking.package = pkg;

    booking.updatedAt = new Date();
    await booking.save();

    return res.status(200).json({ message: "Booking updated", booking });
  } catch (err) {
    console.error("User Booking Update Error:", err.message);
    return res.status(500).json({ error: "Error updating booking" });
  }
};




export const deleteBooking = async (req, res) => {
  try {
    await BookingModel.findByIdAndDelete(req.params.id);
    res.json({ message: `Booking with id ${req.params.id} deleted` });
  } catch (err) {
    res.status(500).json({ error: "Error deleting booking" });
  }
};
export const exportMyBookingsToPDF = async (req, res) => {
  try {
    const userId = req.user.userId;

    const bookings = await BookingModel.find({ userId })
      .populate("facilityId", "name location price")
      .sort({ date: -1 });

    const doc = new PDFDocument();

    // Set PDF headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=ezbook-bookings.pdf");

    doc.pipe(res);

    doc.fontSize(20).text("Your EzBook Bookings", { align: "center" }).moveDown();

    bookings.forEach((booking, index) => {
      doc.fontSize(14).text(`Booking #${index + 1}`, { underline: true });
      doc.text(`Facility: ${booking.facilityId?.name}`);
      doc.text(`Location: ${booking.facilityId?.location}`);
      doc.text(`Date: ${new Date(booking.date).toLocaleDateString()}`);
      doc.text(`Time: ${booking.time}`);
      doc.text(`Package: ${booking.package}`);
      doc.text(`Price: GHS ${booking.facilityId?.price}`);
      doc.text(`Status: ${booking.status}`);
      doc.moveDown();
    });

    doc.end();

  } catch (err) {
    console.error("🔥 PDF Export Error:", err.message);
    res.status(500).json({ error: "Error generating PDF" });
  }
};
