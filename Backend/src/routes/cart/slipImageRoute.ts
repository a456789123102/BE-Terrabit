import {Router} from "express";
 import multer from "multer";
 import { verifyUser } from "../../middlewares/verify";
    import { uploadSlip,deleteSlip } from "../../controllers/carts/slipImageController";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

 router.post("/:orderId/upload",verifyUser,upload.single("image"),uploadSlip);
 router.patch("/:orderId/delete",verifyUser,deleteSlip);

export default router;