import{Schema,model} from "mongoose";
import normalize from "normalize-mongoose";

const bookingSchema = new Schema({
    userId:{type:Schema.Types.ObjectId,ref:'user',required:true},
    facilityId:{type:Schema.Types.ObjectId,ref:'facility',required:true},
    date:{type:Date,required:true},
    startTime:{type:String,required:true},
    endTime:{type:String,required:true},
    package:{type:String,required:true},
    status:{type:String,enum:['approved','pending','cancelled'],default:'pending'},
    createdAt:{type:Date,default:Date.now},
    updatedAt:{type:Date,default:Date.now}
},{timestamps:true});

bookingSchema.plugin(normalize);

export const BookingModel = model("booking",bookingSchema);
