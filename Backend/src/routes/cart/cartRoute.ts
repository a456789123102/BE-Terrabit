import { createCart,getAllCart,getPersonalCart } from "../../controllers/carts/cartController";
import { verifyUser, verifyAdmin } from "../../middlewares/verify";
import {Router} from 'express';

const router = Router();
router.post('/add',verifyUser,createCart);
router.get('/getAll',verifyAdmin,getAllCart);
router.get('/myCart',verifyUser,getPersonalCart);

export default router;