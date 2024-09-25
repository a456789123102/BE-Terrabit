import { Request, Response } from 'express';
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

// create product
export const createProduct = async (req: Request, res: Response) => {
    try {
        const { name, price, categories, quantity, description } = req.body;

        // ตรวจสอบว่ามีข้อมูลครบหรือไม่
        if (!name || !price || !categories || !quantity || !description) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // ตรวจสอบว่าหมวดหมู่ที่ระบุมีอยู่จริงหรือไม่
        const validCategories = await prisma.category.findMany({
            where: { id: { in: categories } }
        });

        if (validCategories.length !== categories.length) {
            return res.status(400).json({ message: 'One or more categories are invalid' });
        }

        // สร้าง product ก่อน
        const product = await prisma.product.create({
            data: {
                name,
                price,
                quantity,
                description
            }
        });

        // เพิ่มความสัมพันธ์ระหว่าง Product กับ Categories ลงในตารางกลาง (ProductCategory)
        const productCategories = categories.map((categoryId: number) => ({
            productId: product.id,
            categoryId: categoryId
        }));

        await prisma.productCategory.createMany({
            data: productCategories
        });

        return res.status(200).json({ message: 'Product created successfully', product });
    } catch (error) {
        return res.status(500).json({ message: 'Error creating product', error });
    }
};
