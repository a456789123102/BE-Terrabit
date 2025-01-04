import { storage } from "../config/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getStorage } from "firebase-admin/storage";

export const uploadProductImageToFirebase = async (file: Express.Multer.File): Promise<string> => {
    try {
      const storageRef = ref(storage, `products/${file.originalname}`);
      const snapshot = await uploadBytes(storageRef, file.buffer);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading image to Firebase:", error);
      throw new Error("Failed to upload image to Firebase.");
    }
  };

  export const deleteImageFromFirebase = async (imageUrl: string) => {
try {
  const storage = getStorage();
  const bucket = storage.bucket();
  const filePath = imageUrl.split("/").pop();

  if (!filePath) {
    throw new Error("Invalid image path");
  }
  await bucket.file(filePath).delete();
  console.log(`File ${filePath} deleted from Firebase.`);
} catch (error) {
  console.error("Error deleting image from Firebase:", error);
  throw new Error("Failed to delete image from Firebase.");
}
  };