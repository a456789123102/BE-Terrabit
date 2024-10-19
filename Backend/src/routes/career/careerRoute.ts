import { createCareer,getCareerById, getAllCareers } from "../../controllers/careers/careerController";
import { verifyUser, verifyAdmin } from "../../middlewares/verify";
import {Router} from "express";

const router = Router();
router.post('/create',verifyAdmin,createCareer);
router.get('/:id',getCareerById);
router.get('/',getAllCareers);
export default router;