import {
  createCategory,
  updateCategory,
  deleteCategory,
  getAllCategory
} from "../../controllers/products/categoryController";
import { verifyUser, verifyAdmin } from "../../middlewares/verify";
import { Router } from "express";

const router = Router();

router.post("/create", verifyAdmin, createCategory);
router.patch("/:id/update", verifyAdmin, updateCategory);
router.delete("/:id/delete", verifyAdmin, deleteCategory);
router.get("/", getAllCategory);

export default router;
