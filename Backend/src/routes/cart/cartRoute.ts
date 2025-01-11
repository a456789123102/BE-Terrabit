import { createCart,getAllCart,getPersonalCart ,deleteOneCartItem, updateQuantity,checkout,clearCartItems} from "../../controllers/carts/cartController";
import { verifyUser, verifyAdmin } from "../../middlewares/verify";
import {Router} from 'express';

const router = Router();
router.post('/add',verifyUser,createCart);
router.get('/getAll',verifyAdmin,getAllCart);
router.get('/myCart',verifyUser,getPersonalCart);
router.delete('/delete/:id',verifyUser,deleteOneCartItem);
router.patch('/update/:id',verifyUser,updateQuantity);
router.post('/checkout', verifyUser, checkout); 
router.delete("/clearAll",verifyUser,clearCartItems);
export default router;