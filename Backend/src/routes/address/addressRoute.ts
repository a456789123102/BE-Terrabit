import {createAddress,editAddress,getOwnAddresses,deleteAddress} from "../../controllers/addresses/addressController"
import { verifyUser, verifyAdmin } from "../../middlewares/verify";
import {Router} from 'express';

const router = Router();
router.post('/create', verifyUser, createAddress);
router.patch('/update', verifyUser,editAddress);
router.get('/myAddress',verifyUser,getOwnAddresses);
router.delete('/delete',verifyUser,deleteAddress);
export default router;