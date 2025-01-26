
import {
    createProduct,
    findAllProducts,
    getProductById,
    editProduct,
    findAllProductsByCatIds,
    getRelatedProducts,
    deleteProduct,
} from "../../controllers/products/productController";
import { verifyUser, verifyAdmin } from "../../middlewares/verify";
import {Router} from 'express';

const router = Router();

router.post('/create',verifyAdmin,createProduct);
router.get('/:id', getProductById);
router.patch('/:id/edit',verifyAdmin,editProduct);
router.delete('/:id/delete',verifyAdmin,deleteProduct);
router.get('/', findAllProducts);
router.get('/category/:id', findAllProductsByCatIds);
router.get('/:productId/related', getRelatedProducts);
export default router;