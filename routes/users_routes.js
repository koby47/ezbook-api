import express from 'express';
import{
    registerUser,
    loginUser,
    getCurrentUser,getAllUsers,googleLogin,verifyEmail
} from '../controllers/users_controllers.js';
import { authenticate } from '../middlewares/auth.js';
import { avatarUpload } from '../utils/upload.js'
import { uploadAvatar } from '../controllers/users_controllers.js';

import { authorize } from '../middlewares/auth.js';
const router = express.Router();

router.post("/google-login",googleLogin);
router.post("/register",registerUser);
router.post("/login",loginUser);
router.get("/me", authenticate, getCurrentUser);
router.get('/verify-email', verifyEmail);
router.patch("/me/avatar", authenticate, avatarUpload.single("avatar"), uploadAvatar);

// Only admins:
router.get("/all", authenticate, authorize(["admin"]), getAllUsers);

export default router;
// This code defines an Express router for user registration and login.
// It imports the necessary functions from the controllers and sets up two routes:
// - POST /register: Calls the registerUser function to handle user registration.
// - POST /login: Calls the loginUser function to handle user login.
// The router is then exported for use in the main application.
// The code is structured to separate the routing logic from the controller logic,
// making it easier to maintain and understand.
// The registerUser function handles user registration by validating the input,
// hashing the password, and creating a new user in the database.
// The loginUser function handles user login by validating the input,
// checking the credentials against the database, and generating a JWT token
// for authenticated users.
// This structure allows for a clean separation of concerns,
// making the codebase more modular and maintainable.
// The use of async/await syntax simplifies the handling of asynchronous operations,
// making the code more readable.
// The router is then exported for use in the main application, 