import { uploadProductImageToFirebase,deleteImageFromFirebase } from "../../utils/ProductImage";
import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();


export const handleProductImages = async (
  files: Express.Multer.File[] | undefined,
  productId: number
) => {
  try {
    if (!files || files.length === 0) {
      // ไม่มีไฟล์ ให้คืนค่า array ว่าง
      return [];
    }

    const uploadedImages = [];
    for (const file of files) {
      // อัปโหลดภาพไปยัง Firebase
      const imageUrl = await uploadProductImageToFirebase(file);

      // บันทึกภาพในฐานข้อมูล
      const newImage = await prisma.productImage.create({
        data: {
          name: file.originalname,
          imageUrl,
          productId,
        },
      });

      uploadedImages.push(newImage);
    }

    return uploadedImages;
  } catch (error) {
    console.error("Error uploading images:", error);
    throw new Error("Failed to upload images.");
  }
};


export const deleteProductImage = async ( req: Request, res:Response) =>{
  console.log("DeleteProductImages")
try {
  const {imageId} = req.params;
  const existingImage = await prisma.productImage.findUnique({
    where: { id: Number(imageId) },
  });
  if (!existingImage) {
    return res.status(404).json({ message: "Image not found." });
  }
  await deleteImageFromFirebase(existingImage.imageUrl);
  await prisma.productImage.delete({
    where: { id: Number(imageId) },
  });
  return res.status(200).json({ message: "Image deleted successfully" });
} catch (error) {
  console.error("Error deleting image:", error);
  return res.status(500).json({ message: "Error deleting image", error });
}
}