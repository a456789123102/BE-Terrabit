import {me,getAllUsers,changeIsActiveStatus } from "../../controllers/users/userController"; 
import { Router } from "express";
import { verifyUser,verifyAdmin } from "../../middlewares/verify";
import {getWeeklyUserForCharts,getTotalUsersForCharts} from "../../controllers/users/userAnalyticsService";

const router = Router();

router.get('/me',verifyUser, me);
router.get('/usersInfo',verifyAdmin,getAllUsers);
router.get('/charts/getWeeklyUserForCharts',verifyAdmin,getWeeklyUserForCharts);
router.get('/charts/getTotalUsersForCharts',verifyAdmin,getTotalUsersForCharts);
router.patch("/:id/changeIsActiveStatus",verifyAdmin,changeIsActiveStatus);

export default router;