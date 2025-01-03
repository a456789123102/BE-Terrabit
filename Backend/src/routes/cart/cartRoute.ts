import { createCart,getAllCart,getPersonalCart ,deleteCart, updateQuantity,checkout} from "../../controllers/carts/cartController";
import { verifyUser, verifyAdmin } from "../../middlewares/verify";
import {Router} from 'express';

const router = Router();
router.post('/add',verifyUser,createCart);
router.get('/getAll',verifyAdmin,getAllCart);
router.get('/myCart',verifyUser,getPersonalCart);
router.delete('/delete/:id',verifyUser,deleteCart);
router.patch('/update/:id',verifyUser,updateQuantity);
router.post('/checkout', verifyUser, checkout); 
export default router;