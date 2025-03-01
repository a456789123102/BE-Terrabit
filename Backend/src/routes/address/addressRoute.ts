import {createAddress,editAddress,getOwnAddresses,getOneAddress,deleteAddress,getProvince,getAmphure,getTambon} from "../../controllers/addresses/addressController"
import { verifyUser, verifyAdmin } from "../../middlewares/verify";
import {Router} from 'express';

const router = Router();
router.post('/create', verifyUser, createAddress);
router.patch('/myAddress/:addressId/update', verifyUser,editAddress);
router.delete('/myAddress/:addressId/delete',verifyUser,deleteAddress);
router.get('/myAddress/:addressId',verifyUser,getOneAddress);
router.get('/myAddress',verifyUser,getOwnAddresses);
router.get('/province',verifyUser,getProvince);
router.get('/:provinceId/amphure',verifyUser,getAmphure);
router.get('/:amphureId/tambon',verifyUser,getTambon);

export default router;