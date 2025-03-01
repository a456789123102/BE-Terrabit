import {createReview,updateReview,getReviewsById,getAllReviews,changeReviewStatus} from "../../controllers/reviews/reviewcontroller";
import {getWeeklyRatingForCharts,getTotalReviewsForCharts} from "../../controllers/reviews/reviewAnalyticsService"
import { Router } from "express"
import { verifyUser,verifyOptionalUser, verifyAdmin } from "../../middlewares/verify";
const router = Router();
router.get('/charts/getWeeklyRatingForCharts',verifyAdmin,getWeeklyRatingForCharts);
router.get('/charts/getTotalReviewsForCharts',verifyAdmin,getTotalReviewsForCharts);
router.get('/all',verifyAdmin,getAllReviews);
router.get('/:id',verifyOptionalUser,getReviewsById);
router.post('/:productId/create',verifyUser, createReview); 
router.patch('/:productId/edit',verifyUser, updateReview); 
router.patch('/changeStatus/:id',verifyAdmin, changeReviewStatus); 

export default router;