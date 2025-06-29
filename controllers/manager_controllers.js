import { FacilityModel } from "../models/facility_models.js";
import { BookingModel } from "../models/booking_models.js";

export const getManagerOverview = async (req,res) => {
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

    // ⚠️ Notifications logic depends on your notification schema
    // Placeholder: returning 0 for now
    const notifications = 0;

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