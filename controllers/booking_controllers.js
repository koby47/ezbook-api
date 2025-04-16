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
    const bookings = await BookingModel.find(JSON.parse(filter)).sort(
      JSON.parse(sort)
    );
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: "Error fetching bookings" });
  }
};


export const getMyBookings = async (req, res) => {
  try {
    const userId = req.user.userId;

    const {
      startDate,
      endDate,
      page = 1,
      limit = 5
    } = req.query;

    const filter = { userId };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const bookings = await BookingModel.find(filter)
      .populate("facilityId", "name location price")
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await BookingModel.countDocuments(filter);

    res.status(200).json({
      total,
      page: parseInt(page),
      count: bookings.length,
      bookings
    });

  } catch (err) {
    console.error(" Get My Bookings Error:", err.message);
    res.status(500).json({ error: "Error fetching your bookings" });
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["approved", "cancelled"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }


    const booking = await BookingModel.findById(req.params.id).populate("userId", "userName email");

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

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
            <p>Your booking has been <strong>${status.toUpperCase()}</strong>.</p>
            <p>Status update: <strong>${status}</strong></p>
            <p>Thank you for using EzBook!</p>
          </div>
        `
      });

      console.log(` Email sent for ${status} status`);
    } catch (err) {
      console.error("Email failed:", err.message);
    }

    res.status(200).json({ message: `Booking ${status}`, booking });

  } catch (err) {
    console.error(" Booking Status Error:", err.message);
    res.status(500).json({ error: "Error updating booking status" });
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
