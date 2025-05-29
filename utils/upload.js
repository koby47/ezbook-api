import multer from 'multer';
import{v2 as cloudinary} from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv'
import path  from 'path';

dotenv.config()

//configure Cloudinary
cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

//local upload(for dev/testing)
export const localUpload =multer({dest:"upload"});

//Cloudinary Upload(for facility pictures)
export const facilityPicturesUpload =multer({
    storage:new CloudinaryStorage({
        cloudinary,
        params:{
            folder:'ezbook-api/facility-pictures',
            public_id:(req,file) => {
                return path.parse(file.originalname).name;},
        },
    }),
});