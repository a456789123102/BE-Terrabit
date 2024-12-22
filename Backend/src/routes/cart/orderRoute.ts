import { Router } from "express";
import { updateOrderStatus,getAllOrders,getmyOrder } from "../../controllers/carts/orderController";
import { verifyUser, verifyAdmin } from "../../middlewares/verify";

const router = Router();

router.put("/:orderId/status", verifyUser, updateOrderStatus);
router.get("/all", verifyAdmin, getAllOrders);
router.get("/:status/myOrder", verifyUser, getAllOrders);
export default router;