import {
    createProduct,
    findAllProducts
} from "../controllers/productController";
import { verifyUser, verifyAdmin } from "../middlewares/verify";
import {Router} from 'express';

const router = Router();
router.post('/create',verifyAdmin, createProduct);
router.get('/', findAllProducts);
export default router;