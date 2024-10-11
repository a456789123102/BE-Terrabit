import {
    createProduct,
    findAllProducts,
    getProductById,
    editProduct,
} from "../../controllers/products/productController";
import { verifyUser, verifyAdmin } from "../../middlewares/verify";
import {Router} from 'express';

const router = Router();
router.post('/create',verifyAdmin, createProduct);
router.get('/', findAllProducts);
router.get('/:id', getProductById);
router.patch('/:id/edit',verifyAdmin, editProduct);
export default router;