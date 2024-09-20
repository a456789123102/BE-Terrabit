import { getAllUsers,me } from "../controllers/userController"; 
import { Router } from "express";

const router = Router();

router.get('/userData', getAllUsers);

export default router;