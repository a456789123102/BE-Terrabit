import { Router } from "express";
import multer from "multer";
import { verifyAdmin } from "../../middlewares/verify";
import { deleteProductImage,uploadSingleProductImage } from "../../controllers/products/productImageController";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Route สำหรับลบรูปภาพ

router.post(
    "/:productId/create",
    verifyAdmin,
    upload.fields([
      { name: "CoverImage", maxCount: 1 },
      { name: "DetailImage1", maxCount: 1 },
      { name: "DetailImage2", maxCount: 1 },
    ]),
    uploadSingleProductImage
  );
router.delete("/:imageId/delete", verifyAdmin, deleteProductImage);

export default router;
