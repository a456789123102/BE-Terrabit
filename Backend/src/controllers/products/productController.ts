import { Request, Response } from 'express';
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

// create product
export const createProduct = async (req: Request, res: Response) => {
    try {
        const { name, price, categories, quantity, description } = req.body;

        // ตรวจสอบว่ามีข้อมูลครบถ้วนหรือไม่
        if (!name || !price || !categories || !quantity || !description) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        const existingProduct = await prisma.product.findUnique({
            where: { name }
        });
        if (existingProduct) {
            return res.status(400).json({ message: 'Product name already exists' });
        }
        const validCategories = await prisma.category.findMany({
            where: { id: { in: categories } }
        });
        if (validCategories.length !== categories.length) {
            return res.status(400).json({ message: 'One or more categories are invalid' });
        }
        const product = await prisma.product.create({
            data: {
                name,
                price,
                quantity,
                description
            }
        });
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

// findAll product
export const findAllProducts = async (req: Request, res: Response) => {
    try {
        // รับค่าคำค้นหาจาก query params
        const searchQuery = req.query.search as string | undefined;
        const categoryIds = req.query.category as string | string[] | undefined;

        // สร้างตัวแปร where ที่จะใช้ในการค้นหา
        const where: any = {}; // กำหนด where clause แบบ dynamic

        // หากมีคำค้นหาในชื่อสินค้า
        if (searchQuery) {
            where.name = {
                contains: searchQuery.toLowerCase() // จัดการคำค้นหาด้วยการแปลงเป็นตัวพิมพ์เล็ก
                
            };
        }

        // หากมีการส่ง category id มาและสามารถส่งมาได้หลายค่า
        if (categoryIds) {
            const categoryFilter = Array.isArray(categoryIds) ? categoryIds.map(Number) : [Number(categoryIds)];
            where.ProductCategory = {
                some: {
                    categoryId: {
                        in: categoryFilter, // กรองตาม category id ที่ส่งมา
                    },
                },
            };
        }

        // ค้นหาสินค้าตามเงื่อนไขที่กำหนด
        const products = await prisma.product.findMany({
            where,
            include: {
                ProductCategory: {
                    include: {
                        category: true, 
                    },
                },
            },
        });


        return res.status(200).json(products);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error while getting products', error });
    }
};

//findOneProduct 
export const getProductById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const productId = parseInt(id);

        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: {
                ProductCategory: {
                    include: {
                        category: true,
                    },
                },
                Image: true, 
                Review: {
                    select: {  
                        rating: true,
                        comments: true,
                        user: { 
                            select: {
                                username: true, 
                            },
                        },
                    },
                },
            },
        });

        // ตรวจสอบว่าพบสินค้าไหม
        if (!product) {
            return res.status(404).json({ message: 'ไม่พบสินค้า' });
        }

        // ถ้าไม่มีรูปภาพ ให้ตั้งเป็น array ว่าง
        if (!product.Image) {
            product.Image = [];
        }

        // ถ้าไม่มีรีวิว ให้ตั้งเป็น array ว่าง
        if (!product.Review) {
            product.Review = [];
        }

        return res.status(200).json(product);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า', error });
    }
}



