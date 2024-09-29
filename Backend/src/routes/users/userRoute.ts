import {me,getAllUsers } from "../../controllers/users/userController"; 
import { Router } from "express";
import { verifyUser,verifyAdmin } from "../../middlewares/verify";

const router = Router();

router.get('/me',verifyUser, me);
router.get('/usersInfo',verifyAdmin,getAllUsers);

export default router;