import {addImage} from "../../controllers/products/imageController"
import { verifyUser, verifyAdmin } from "../../middlewares/verify";
import {Router} from 'express';
import multer from 'multer';


const upload = multer(); 
const router = Router();

router.post("/addImage",verifyAdmin,upload.single('file'),addImage);

export default router;