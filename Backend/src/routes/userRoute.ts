import { getAllUsers,me } from "../controllers/userController"; 
import { Router } from "express";

const router = Router();

router.get('/me', me);

export default router;