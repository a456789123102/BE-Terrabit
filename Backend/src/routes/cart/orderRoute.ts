import { Router } from "express";
import { updateOrderStatusByUser,getAllOrders,getmyOrder,getOrderById,deleteOrder,updateOrderAddress,updateOrderStatusByAdmin 
,getOrderForCharts
} from "../../controllers/carts/orderController";
import { verifyUser, verifyAdmin } from "../../middlewares/verify";

const router = Router();

router.patch("/:orderId/userUpdateStatus", verifyUser, updateOrderStatusByUser);
router.patch("/:orderId/adminUpdateStatus", verifyAdmin, updateOrderStatusByAdmin);
router.get("/myOrder/:orderId", verifyUser, getOrderById);
router.get("/:status/myOrder", verifyUser, getmyOrder);
router.delete("/:orderId/delete", verifyUser, deleteOrder);
router.get("/all", verifyAdmin, getAllOrders);
router.patch("/update/:orderId", verifyUser, updateOrderAddress);
router.get("/charts/getOrderForCharts", verifyAdmin, getOrderForCharts);

export default router;