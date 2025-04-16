import { BookingModel } from "../models/booking_models.js";
import { bookingValidator } from "../validators/booking_validators.js";
import { sendEmail } from "../utils/sendEmails.js";

// export const createBooking = async (req, res) => {
//   try {
//     const { error, value } = bookingValidator.validate(req.body, {
//       abortEarly: false,
//     });
//     if (error)
//       return res
//         .status(422)
//         .json({ errors: error.details.map((e) => e.message) });

//     const booking = await bookingValidator.create(value);

//     await sendEmail({
//       to: user.email,
//       subject: "EzBook Booking Confirmation",
//       text: `Hi ${user.userName}, your booking has been confirmed!`,
//       html: `
//     <p>Hello <strong>${user.userName}</strong>,<br>Your booking for the facility has been <strong> successful</strong>.</p>
//     <p>Thank you for using EzBook!</p>
//   `
//     });

//     res.status(201).json({ message: "Booking created successfully", booking });
//   } catch (err) {
//     res.status(500).json({ error: "Error creating booking" });
//   }
// };

//


export const createBooking = async (req, res) => {
  try {
    const { error, value } = bookingValidator.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(422).json({ errors: error.details.map(e => e.message) });
    }

    const booking = await BookingModel.create(value);

    try {
      const user = await UserModel.findById(value.userId);

      if (user) {
        await sendEmail({
          to: user.email,
          subject: "EzBook Booking Confirmation",
          text: `Hi ${user.userName}, your booking has been confirmed!`,
          html: `
            <h3>Hi ${user.userName},</h3>
            <p>Your booking for the facility <strong>${value.facilityId}</strong> on <strong>${value.date}</strong> at <strong>${value.time}</strong> has been confirmed.</p>
            <p>Thank you for booking with EzBook!</p>
          `
        });
      }
    } catch (emailError) {
      console.error("Email Sending Error:", emailError.message);
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

export const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await BookingModel.findByIdAndUpdate(req.params.id);
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    booking.status = status;
    await booking.save();

    res.json({ message: "Booking status updated", booking });
  } catch (err) {
    res.status(500).json({ error: "Error updating booking" });
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
