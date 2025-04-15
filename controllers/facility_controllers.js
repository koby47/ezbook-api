import{FacilityModel } from '../models/facility_models.js';
import { addFacilityValidator } from '../validators/facility_validators';

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

export const getFacilities = async(req,res,next)=>{
    try{
        const {
            filter ="{}",sort = "{}" }= req.query;
        const results = await FacilityModel.find(JSON.parse(filter)).sort(JSON.parse(sort));
        res.json(results);
        }catch (err){
            next(err);
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