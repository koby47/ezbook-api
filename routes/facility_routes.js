import express from 'express';
import{
    addFacility,
    getFacilities,
    updateFacility,
    deleteFacility,
} from '../controllers/facility_controllers.js';
import{authenticate,checkRole} from '../middlewares/auth.js';

const router = express.Router();

const upload = multer({ Dest:'uploads/' });

router.post("/",authenticate,checkRole('manager'),upload.array('pictures',5),addFacility);
router.get("/",authenticate,getFacilities);
router.put("/:id",authenticate,checkRole('manager'),upload.array('pictures',5),updateFacility);
router.delete("/:id",authenticate,checkRole('manager'),deleteFacility);

export default router;
// This code defines an Express router for managing facilities.
// It imports the necessary functions from the controllers and middlewares.
// It sets up four routes:
// - POST /: Calls the addFacility function to handle adding a new facility.
// - GET /: Calls the getFacilities function to retrieve all facilities.
// - PUT /:id: Calls the updateFacility function to update an existing facility by ID.
// - DELETE /:id: Calls the deleteFacility function to delete a facility by ID.
// The router uses middleware for authentication and role checking,
// ensuring that only authenticated users with the 'manager' role can add, update, or delete facilities.
// The multer middleware is used to handle file uploads,
// allowing up to 5 pictures to be uploaded for each facility.
// The router is then exported for use in the main application.     