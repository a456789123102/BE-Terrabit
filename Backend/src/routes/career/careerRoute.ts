import { createCareer } from "../../controllers/careers/careerController";
import { verifyUser, verifyAdmin } from "../../middlewares/verify";
import {Router} from "express";

const router = Router();
router.post('/create',verifyAdmin,createCareer);
export default router;