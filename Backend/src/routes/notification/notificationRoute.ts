import {Router} from "express";
import {createNotifications,getOwnNotifications, deleteNotification,deleteAllNotification} from "../../controllers/notifications/notificationcController";
import {verifyUser} from "../../middlewares/verify";

const router = Router();

router.post("/create", verifyUser, createNotifications);
router.get("/myNotifications", verifyUser, getOwnNotifications);
router.delete("/:id/delete", verifyUser, deleteNotification);
router.delete("/clearAll", verifyUser, deleteAllNotification);

export default router;