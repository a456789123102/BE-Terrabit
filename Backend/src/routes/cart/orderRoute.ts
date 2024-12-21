import { Router } from "express";
import { updateOrderStatus } from "../../controllers/carts/orderController";
import { verifyUser, verifyAdmin } from "../../middlewares/verify";

const router = Router();

router.put("/:orderId/status", verifyUser, updateOrderStatus);
export default router;