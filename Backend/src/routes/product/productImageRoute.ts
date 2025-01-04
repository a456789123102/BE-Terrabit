import { Router } from "express";
import { verifyAdmin } from "../../middlewares/verify";
import { deleteProductImage } from "../../controllers/products/productImageController";

const router = Router();

// Route สำหรับลบรูปภาพ
router.delete("delete/:imageId", verifyAdmin, deleteProductImage);

export default router;
