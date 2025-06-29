import express from "express";
import { getManagerOverview } from "../controllers/manager_controllers.js";
import { authenticate, authorize } from "../middlewares/auth.js";

const router = express.Router();

router.get("/overview", authenticate, authorize(["manager"]), getManagerOverview);

export default router;
