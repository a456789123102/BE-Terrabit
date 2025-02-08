import {createReview,updateReview,getReviewsById} from "../../controllers/products/reviewcontroller";
import { Router } from "express"
import { verifyUser,verifyOptionalUser } from "../../middlewares/verify";
const router = Router();
router.get('/view/:id',verifyOptionalUser,getReviewsById);
router.post('/create/:productId',verifyUser, createReview); 
router.patch('/edit/:productId',verifyUser, updateReview); 
export default router;