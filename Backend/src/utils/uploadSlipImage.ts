import {storage} from "../config/firebase";
import {ref,uploadBytes, getDownloadURL} from "firebase/storage";

export const uploadSlipToFirebase = async (file: Express.Multer.File): Promise<string> => {
    const storageRef = ref(storage, `slips/${file.originalname}`);
    await uploadBytes(storageRef, file.buffer);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
};