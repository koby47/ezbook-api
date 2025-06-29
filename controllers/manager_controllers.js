import { FacilityModel } from "../models/facility_models.js";
import { BookingModel } from "../models/booking_models.js";

export const getManagerOverview = async (req, res) => {
  try {
    const managerId = req.user._id;

    // 1. Count total facilities created by this manager
    const totalFacilities = await FacilityModel.countDocuments({ createdBy: managerId });

    // 2. Get all facility IDs managed by this manager
    const facilities = await FacilityModel.find({ createdBy: managerId }).select("_id");
    const facilityIds = facilities.map(f => f._id);

    // 3. Count all bookings linked to these facilities
    const totalBookings = await BookingModel.countDocuments({
      facilityId: { $in: facilityIds }
    });

    // 4. Count pending approvals for these facilities
    const pendingApprovals = await BookingModel.countDocuments({
      facilityId: { $in: facilityIds },
      status: "pending"
    });

    // 5. Generate notifications for pending bookings
    const pendingBookings = await BookingModel.find({
      facilityId: { $in: facilityIds },
      status: "pending"
    })
    .populate("facilityId", "name")
    .populate("userId", "userName")
    .sort({ createdAt: -1 }) // Latest first
    .limit(5); // Limit to 5 notifications

    const notifications = pendingBookings.map(b => ({
      message: `New booking for ${b.facilityId?.name || "Unknown Facility"} on ${new Date(b.date).toLocaleDateString()}`,
      user: b.userId?.userName || "Unknown User",
      date: b.createdAt,
    }));

    res.status(200).json({
      totalFacilities,
      totalBookings,
      pendingApprovals,
      notifications
    });

  } catch (err) {
    console.error("Manager Overview API Error:", err.message);
    res.status(500).json({ error: "Server error fetching manager overview" });
  }
};
