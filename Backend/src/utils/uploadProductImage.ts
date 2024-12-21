import { storage } from "../config/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export const uploadProductImageToFirebase = async (file: Express.Multer.File): Promise<string> => {
    const storageRef = ref(storage, `products/${file.originalname}`);
    const snapshot = await uploadBytes(storageRef, file.buffer);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
};