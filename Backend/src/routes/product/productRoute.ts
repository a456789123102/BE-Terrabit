import multer from "multer";
import {
    createProduct,
    findAllProducts,
    getProductById,
    editProduct,
    findAllProductsByCatIds,
    getRelatedProducts,
} from "../../controllers/products/productController";
import { verifyUser, verifyAdmin } from "../../middlewares/verify";
import {Router} from 'express';

const router = Router();
const upload = multer();

router.post('/create',verifyAdmin,createProduct);
router.get('/:id', getProductById);
router.patch('/:id/edit',verifyAdmin,editProduct);
router.get('/', findAllProducts);
router.get('/category/:id', findAllProductsByCatIds);
router.get('/:productId/related', getRelatedProducts);
export default router;