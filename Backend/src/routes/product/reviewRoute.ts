import {createReview,updateReview} from "../../controllers/products/reviewcontroller";
import { Router } from "express"
import { verifyUser } from "../../middlewares/verify";
const router = Router();

router.post('/:productId',verifyUser, createReview); 
router.patch('/edit/:productId',verifyUser, updateReview); 
export default router;