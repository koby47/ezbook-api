import{FacilityModel } from '../models/facility_models.js';
import { addFacilityValidator } from '../validators/facility_validators.js';



// export const addFacility = async (req, res) => {
//   try {
//     const pictures = req.files ? req.files.map(file => file.path) : [];

//     // Inject pictures into validation object
//     const { error, value } = addFacilityValidator.validate(
//       { ...req.body, pictures },
//       { abortEarly: false }
//     );

  
//     if (error) return res.status(422).json({ errors: error.details.map(e => e.message) });

//     // Add createdBy from logged-in user
//     const facility = await FacilityModel.create({
//       ...value,
//       createdBy:req.user.userId,
//     });

//     res.status(201).json({ message: "Facility created successfully", facility });

//   } catch (err) {
//     console.error("Facility Creation Error:", err.message);
//     res.status(500).json({ error: "Error adding facility" });
//   }
// };



export const addFacility = async (req, res) => {
  try {
    const pictures = req.files ? req.files.map(file => file.path) : [];

    // 📝 Inject createdBy before validation
    const dataToValidate = {
      ...req.body,
      pictures,
      createdBy: req.user.userId,
    };

    // ✅ Validate including createdBy
    const { error, value } = addFacilityValidator.validate(dataToValidate, { abortEarly: false });

    if (error) {
      return res.status(422).json({ errors: error.details.map(e => e.message) });
    }

    // 🔐 Save directly using validated value
    const facility = await FacilityModel.create(value);

    res.status(201).json({ message: "Facility created successfully", facility });

  } catch (err) {
    console.error("Facility Creation Error:", err.message);
    res.status(500).json({ error: "Error adding facility" });
  }
};


export const getFacilities = async (req, res) => {
  try {
    const {
      type,
      location,
      minPrice,
      maxPrice,
      availability,
      keyword,
      sortBy = "createdAt",  // ✅ Sort by createdAt by default
      order = "desc",         // ✅ Descending order (latest first)
      page = 1,
      limit = 8
    } = req.query;

    const filter = {};

    // ✅ Manager-specific filtering
    if (req.user?.role === "manager") {
      filter.createdBy = req.user._id;
    }

    // ✅ Keyword search (name/description)
    if (keyword) {
      filter.$or = [
        { name: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } }
      ];
    }

    // ✅ Filter by type and location
    if (type) filter.type = new RegExp(`^${type}$`, "i");
    if (location) filter.location = new RegExp(`^${location}$`, "i");

    // ✅ Price range
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // ✅ Availability
    if (availability !== undefined) {
      filter.availability = availability === "true";
    }

    // ✅ Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // ✅ Sorting
    const sort = {};
    sort[sortBy] = order === "desc" ? -1 : 1;

    // ✅ Query the DB
    const facilities = await FacilityModel.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await FacilityModel.countDocuments(filter);

    res.status(200).json({
      total,
      page: parseInt(page),
      count: facilities.length,
      facilities
    });

  } catch (err) {
    console.error("Facility Filter Error:", err.message);
    res.status(500).json({ error: "Error filtering facilities" });
  }
};

export const getSingleFacility = async (req, res) => {
  try {
    const facility = await FacilityModel.findById(req.params.id);
    if (!facility) {
      return res.status(404).json({ error: "Facility not found" });
    }
    res.status(200).json({ facility });
  } catch (err) {
    console.error("Get Single Facility Error:", err.message);
    res.status(500).json({ error: "Error fetching facility" });
  }
};



export const updateFacility = async(req,res)=>{
    try{
        const newPictures = req.files ? req.files.map(file => file.filename): [];
        const facility = await FacilityModel.findById(req.params.id);
        if(!facility) return res.status(404).json({error:"Facility not found"});

        const pictures =[...facility.pictures, ...newPictures];
        const{error,value} = addFacilityValidator.validate({...req.body,pictures},{abortEarly:false});
        if(error) return res.status(422).json({errors:error.details.map(e => e.message)});

        const updated = await FacilityModel.findByIdAndUpdate(req.params.id,value, {new:true});
        res.json({message: "Facility updated successfully",facility:updated});
    }catch (err){
        res.status(500).json({error:"Error updating facility"});
    }
};



// export const deleteFacility = async (req, res) => {
//   try {
//     const facility = await FacilityModel.findById(req.params.id);

//     if (!facility) {
//       return res.status(404).json({ error: "Facility not found" });
//     }

//     //  Managers can only delete their own facilities
//     if (
//       req.user.role === "manager" &&
//       String(facility.createdBy) !== String(req.user._id)
//     ) {
//       return res.status(403).json({
//         error: "Forbidden: You can only delete facilities you created"
//       });
//     }

//     // Admin can delete anything; manager validated above
//     await facility.deleteOne();

//     res.status(200).json({ message: "Facility deleted successfully" });

//   } catch (error) {
//     console.error("Delete Facility Error:", error.message);
//     res.status(500).json({ error: "Error deleting facility" });
//   }
// };

export const deleteFacility = async (req, res) => {
  try {
    console.log("===== DELETE FACILITY DEBUG =====");
    console.log("Request Params ID:", req.params.id);
    console.log("Request User:", req.user);

    const facility = await FacilityModel.findById(req.params._id);

    console.log("Facility Found:", facility ? "Yes" : "No");

    if (!facility) {
      console.log("❌ Facility not found");
      return res.status(404).json({ error: "Facility not found" });
    }

    console.log("Facility createdBy:", facility.createdBy.toString());
    console.log("Request user ID:", req.user._id);
    console.log("Request user role:", req.user.role);

    // Managers can only delete their own facilities
    if (
      req.user.role === "manager" &&
      String(facility.createdBy) !== String(req.user._id)
    ) {
      console.log("❌ Forbidden: Manager attempting to delete facility not created by them");
      return res.status(403).json({
        error: "Forbidden: You can only delete facilities you created"
      });
    }

    // Admin can delete anything; manager validated above
    await facility.deleteOne();

    console.log("✅ Facility deleted successfully");
    res.status(200).json({ message: "Facility deleted successfully" });

  } catch (error) {
    console.error("Delete Facility Error:", error.message);
    res.status(500).json({ error: "Error deleting facility" });
  }
};
