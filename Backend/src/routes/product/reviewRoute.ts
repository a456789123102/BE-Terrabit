import {createReview,updateReview,getReviewsById} from "../../controllers/products/reviewcontroller";
import { Router } from "express"
import { verifyUser,verifyOptionalUser } from "../../middlewares/verify";
const router = Router();
router.get('/:id',verifyOptionalUser,getReviewsById);
router.post('/:productId/create',verifyUser, createReview); 
router.patch('/:productId/edit',verifyUser, updateReview); 
export default router;