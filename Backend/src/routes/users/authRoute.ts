import {register,login,changePassword,changeUsername} from "../../controllers/users/authController"
import { Router } from "express"
import { verifyUser } from "../../middlewares/verify";

const router = Router();
router.post("/register",register);
router.post("/login",login);
router.patch('/changePassword',verifyUser,changePassword);
router.patch('/changeUsername',verifyUser,changeUsername);
export default router;
