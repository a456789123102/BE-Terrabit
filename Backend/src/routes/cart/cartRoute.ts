import { createCart } from "../../controllers/carts/cartController";
import { verifyUser, verifyAdmin } from "../../middlewares/verify";
import {Router} from 'express';

const router = Router();
router.post('/add',verifyUser,createCart);
export default router;