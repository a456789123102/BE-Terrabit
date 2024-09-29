import { Request, Response } from 'express';
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Add Image
export const addImage = async (req: Request, res: Response) => {
    try {
        const { name, imageUrl, productId } = req.body;

        // ตรวจสอบว่ามีการส่ง productId มาหรือไม่
        if (!productId) {
            return res.status(400).json({ message: "Product ID is required" });
        }

        // ตรวจสอบว่าสินค้ามีอยู่จริงหรือไม่
        const product = await prisma.product.findUnique({
            where: { id: parseInt(productId) },
        });

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        const imageCount = await prisma.productImage.count({
            where: { productId: parseInt(productId) },
        });

        if (imageCount >= 5) {
            return res.status(400).json({ message: "This product already has 5 images, no more images can be added." });
        }

        const image = await prisma.productImage.create({
            data: {
                name,
                imageUrl,
                product: {
                    connect: {
                        id: product.id,
                    }
                }
            }
        });

        return res.status(201).json(image);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error adding image', error });
    }
};
