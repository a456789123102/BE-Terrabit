import {
  createCategory,
  updateCategory,
  deleteCategory
} from "../controllers/categoryController";
import { verifyUser, verifyAdmin } from "../middlewares/verify";
import { Router } from "express";

const router = Router();

router.post("/create", verifyAdmin, createCategory);
router.put("/update/:id", verifyAdmin, updateCategory);
router.delete("/delete/:id", verifyAdmin, deleteCategory);

export default router;