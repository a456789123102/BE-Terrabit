import { Router } from "express";
import { updateOrderStatusByUser,getAllOrders,getmyOrder,getOrderById,deleteOrder,updateOrderAddress,updateOrderStatusByAdmin ,
} from "../../controllers/orders/orderController";
import {getOrderForCharts,getTotalIncomesForCharts,getTopSellerItems,getWeeklySaleForCharts} from "../../controllers/orders/orderAnalyticsService";
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
router.get("/charts/getTotalIncomesForCharts", verifyAdmin, getTotalIncomesForCharts);
router.get("/charts/getTopSellerItems", verifyAdmin, getTopSellerItems);
router.get("/charts/getWeeklySaleForCharts", verifyAdmin, getWeeklySaleForCharts);

export default router;