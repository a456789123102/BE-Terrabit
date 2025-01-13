import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../config/firebase";

export const uploadProductImageToFirebase = async (file: Express.Multer.File): Promise<string> => {
  try {
    const fileName = `slip/${file.originalname}`;
    const storageRef = ref(storage, fileName);

    // Upload the file
    const snapshot = await uploadBytes(storageRef, file.buffer);

    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log(`File uploaded to: ${downloadURL}`);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading image to Firebase:", error);
    throw new Error("Failed to upload image to Firebase.");
  }
};

// export const deleteImageFromFirebase = async (imageUrl: string): Promise<void> => {
//   try {
//     console.error("Firebase Client SDK does not support file deletion directly.");
//     throw new Error("File deletion is not supported using Firebase Client SDK.");
//   } catch (error) {
//     console.error("Error deleting image from Firebase:", error);
//     throw new Error("Failed to delete image from Firebase.");
//   }
// };
