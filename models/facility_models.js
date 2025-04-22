import{Schema,model} from 'mongoose';
import  normalize from 'normalize-mongoose';

const facilitySchema = new Schema({
    name:{type:String,required:true,unique:true},
    description:{type:String,required:true},
    type:{type:String,enum:['hotel','conference room','party venue','hall'],required:true},
    location:{type:String,required:true},
    price:{type:Number,required:true},
    availability:{type:Boolean,default:true},
    pictures: [{ type: String }],
    bookings:[{type:String}],
    createdBy:{type:Schema.Types.ObjectId,ref:'user',required:true},
    createdAt:{type:Date,default:Date.now},
    updatedAt:{type:Date,default:Date.now}
},{timestamps:true});
facilitySchema.plugin(normalize);
export const FacilityModel = model('facility',facilitySchema);
