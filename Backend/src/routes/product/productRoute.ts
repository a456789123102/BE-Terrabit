import multer from "multer";
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
const upload = multer();

router.post('/create',verifyAdmin,  upload.fields([
    { name: "CoverImage", maxCount: 1 },
    { name: "ImageDetail1", maxCount: 1 },
    { name: "ImageDetail2", maxCount: 1 },
  ]), createProduct);
router.get('/:id', getProductById);
router.patch('/:id/edit',verifyAdmin,  upload.fields([
    { name: "CoverImage", maxCount: 1 },
    { name: "ImageDetail1", maxCount: 1 },
    { name: "ImageDetail2", maxCount: 1 },
  ]), editProduct);
router.get('/', findAllProducts);
router.get('/category/:id', findAllProductsByCatIds);
export default router;