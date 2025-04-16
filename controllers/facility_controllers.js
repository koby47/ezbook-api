import{FacilityModel } from '../models/facility_models.js';
import { addFacilityValidator } from '../validators/facility_validators.js';

export const addFacility = async(req,res) =>{
    try{
        const pictures = req.files ? req.files.map(file => file.filename) : [];
        const {error,value} = addFacilityValidator.validate({...req.body,pictures},{abortEarly:false});

        if(error) return res.status(422).json({errors:error.details.manp(e => e.message)});

        const facility = await FacilityModel.create(value);
        res.status(201).json({message:"Facility created successfully",facility});
    }catch (err){
        res.status(500).json({error:"Error adding facility"})
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
      sortBy = "price",
      order = "asc",
      page = 1,
      limit = 6
    } = req.query;

    const filter = {};

    // Text search on name or description
    if (keyword) {
      filter.$or = [
        { name: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } }
      ];
    }

    // 🏷 Type and Location (case-insensitive exact match)
    if (type) filter.type = new RegExp(`^${type}$`, "i");
    if (location) filter.location = new RegExp(`^${location}$`, "i");

    //  Price range
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Availability filter
    if (availability !== undefined) {
      filter.availability = availability === "true";
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // ↕Sorting
    const sort = {};
    sort[sortBy] = order === "desc" ? -1 : 1;

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
    console.error("🔥 Facility Filter Error:", err.message);
    res.status(500).json({ error: "Error filtering facilities" });
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

export const deleteFacility = async(req,res)=>{
    try{
        await FacilityModel.findByIdAndDelete(req.params.id);
        res.json({message:`Facility with id ${req.params.id} deleted successfully`})
    }catch(err){
        res.statsu(500).json({error:"Error deleting facility"});
    }
};