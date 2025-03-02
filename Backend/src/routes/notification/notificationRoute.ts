import {Router} from "express";
import {createNotifications,getOwnNotifications, markNotificationAsRead} from "../../controllers/notifications/notificationcController";
import {verifyUser} from "../../middlewares/verify";

const router = Router();

router.post("/create", verifyUser, createNotifications);
router.get("/myNotifications", verifyUser, getOwnNotifications);
router.patch("/markAsRead", verifyUser, markNotificationAsRead);

export default router;