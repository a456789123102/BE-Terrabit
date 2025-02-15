import {createReview,updateReview,getReviewsById,getAllReviews} from "../../controllers/reviews/reviewcontroller";
import {getWeeklyRatingForCharts} from "../../controllers/reviews/reviewAnalyticsService"
import { Router } from "express"
import { verifyUser,verifyOptionalUser, verifyAdmin } from "../../middlewares/verify";
const router = Router();
router.get('/charts/getWeeklyRatingForCharts',verifyAdmin,getWeeklyRatingForCharts);
router.get('/all',verifyAdmin,getAllReviews);
router.get('/:id',verifyOptionalUser,getReviewsById);
router.post('/:productId/create',verifyUser, createReview); 
router.patch('/:productId/edit',verifyUser, updateReview); 

export default router;