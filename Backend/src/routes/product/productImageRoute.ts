import { Router } from "express";
import multer from "multer";
import { uploadProductImage } from "../../controllers/products/productImageController";
import { verifyAdmin } from "../../middlewares/verify";

const router = Router();
const upload = multer(); // ใช้สำหรับจัดการการอัปโหลดไฟล์

router.post("/:productId/upload", verifyAdmin, upload.single("image"), uploadProductImage);

export default router;
