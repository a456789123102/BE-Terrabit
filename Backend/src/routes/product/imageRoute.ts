import {addImage} from "../../controllers/products/imageController"
import { verifyUser, verifyAdmin } from "../../middlewares/verify";
import {Router} from 'express';

const router = Router();

router.post("/addImage",verifyAdmin,addImage);

export default router;