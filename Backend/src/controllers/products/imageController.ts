import { uploadProductImageToFirebase } from "../../utils/uploadProductImage";
import { PrismaClient } from "@prisma/client";
import { Request,Response } from "express";

const prisma = new PrismaClient();

export const uploadProductImage = async (req: Request, res: Response) => {
  try {
      const { productId } = req.params;
      if (!req.file) {
          return res.status(400).json({ message: "File is required." });
      }

      const imageUrl = await uploadProductImageToFirebase(req.file);

      const newImage = await prisma.productImage.create({
          data: {
              name: req.file.originalname,
              imageUrl,
              productId: Number(productId),
          },
      });

      return res.status(200).json({ message: "Product image uploaded successfully.", newImage });
  } catch (error) {
      console.error("Upload product image error:", error);
      return res.status(500).json({ error: "Failed to upload product image", details: error });
  }
};