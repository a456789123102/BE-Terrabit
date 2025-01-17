import {createAddress,editAddress,getOwnAddresses,deleteAddress,getOneAddresses} from "../../controllers/addresses/addressController"
import { verifyUser, verifyAdmin } from "../../middlewares/verify";
import {Router} from 'express';

const router = Router();
router.post('/create', verifyUser, createAddress);
router.patch('/myAddress/:addressId/update', verifyUser,editAddress);
router.delete('/myAddress/:addressId/delete',verifyUser,deleteAddress);
router.get('/myAddress/:addressId',verifyUser,getOneAddresses);
router.get('/myAddress',verifyUser,getOwnAddresses);


export default router;