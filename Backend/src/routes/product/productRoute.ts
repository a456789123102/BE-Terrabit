import {
    createProduct,
    findAllProducts,
    getProductById,
    editProduct,
    findAllProductsByCatIds,
} from "../../controllers/products/productController";
import { verifyUser, verifyAdmin } from "../../middlewares/verify";
import {Router} from 'express';

const router = Router();
router.post('/create',verifyAdmin, createProduct);
router.get('/:id', getProductById);
router.patch('/:id/edit',verifyAdmin, editProduct);
router.get('/', findAllProducts);
router.get('/category/:id', findAllProductsByCatIds);
export default router;