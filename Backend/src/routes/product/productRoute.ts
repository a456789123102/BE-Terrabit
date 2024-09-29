import {
    createProduct,
    findAllProducts,
    getProductById,
} from "../../controllers/products/productController";
import { verifyUser, verifyAdmin } from "../../middlewares/verify";
import {Router} from 'express';

const router = Router();
router.post('/create',verifyAdmin, createProduct);
router.get('/', findAllProducts);
router.get('/:id', getProductById);
export default router;