import { Router } from "express";
import { updateOrderStatus,getAllOrders,getmyOrder,getOrderById,deleteOrder } from "../../controllers/carts/orderController";
import { verifyUser, verifyAdmin } from "../../middlewares/verify";

const router = Router();

router.put("/:orderId/status", verifyUser, updateOrderStatus);
router.get("/myOrder/:orderId", verifyUser, getOrderById);
router.get("/:status/myOrder", verifyUser, getmyOrder);
router.delete("/:orderId/delete", verifyUser, deleteOrder);
router.get("/all", verifyAdmin, getAllOrders);

export default router;