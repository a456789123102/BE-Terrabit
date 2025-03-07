import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { uploadProductImageToFirebase,deleteImageFromFirebase } from "../../utils/ProductImage";

const prisma = new PrismaClient();

export const uploadSingleProductImage = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    if (!productId) {
      return res.status(400).json({ message: "Product ID is required." });
    }

    const files = req.files as Record<string, Express.Multer.File[]>;
    if (!files || Object.keys(files).length === 0) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const validFieldNames = ["CoverImage", "DetailImage1", "DetailImage2"];
    let uploadedImage;

    for (const fieldName of validFieldNames) {
      const fileArray = files[fieldName]; 
      if (fileArray && fileArray.length > 0) {
        const file = fileArray[0]; 

        const product = await prisma.product.findUnique({
          where: { id: Number(productId) },
        });
        if (!product) {
          return res.status(404).json({ message: "Product not found." });
        }

        const isExistingImage = await prisma.productImage.findMany({
          where: {
            productId: Number(productId),
            name: fieldName,
          },
        });
        if (isExistingImage.length > 0) {
          return res.status(400).json({
            message: `Image with name "${fieldName}" already exists for this product.`,
          });
        }
        const imageUrl = await uploadProductImageToFirebase(file);

        uploadedImage = await prisma.productImage.create({
          data: {
            name: fieldName,
            imageUrl,
            productId: Number(productId),
          },
        });

        break; 
      }
    }

    if (!uploadedImage) {
      return res.status(400).json({
        message: `File field must be one of: ${validFieldNames.join(", ")}`,
      });
    }

    return res.status(200).json({
      message: "Image uploaded successfully.",
      image: uploadedImage,
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    return res.status(500).json({ message: "Error uploading image.", error });
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
  //await deleteImageFromFirebase(existingImage.imageUrl); penging na
  await prisma.productImage.delete({
    where: { id: Number(imageId) },
  });
  return res.status(200).json({ message: "Image deleted successfully" });
} catch (error) {
  console.error("Error deleting image:", error);
  return res.status(500).json({ message: "Error deleting image", error });
}
}