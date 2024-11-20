import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// create product
export const createProduct = async (req: Request, res: Response) => {
  try {
    console.log("Product_create");
    const { name, price, discount, categories, quantity, description } =
      req.body;

    // ตรวจสอบว่ามีข้อมูลครบถ้วนหรือไม่
    if (
      !name?.trim() ||
      price === undefined ||
      !Array.isArray(categories) ||
      categories.length === 0 ||
      quantity === undefined ||
      !description?.trim()
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const existingProduct = await prisma.product.findUnique({
      where: { name },
    });
    if (existingProduct) {
      return res.status(400).json({ message: "Product name already exists" });
    }
    const validCategories = await prisma.category.findMany({
      where: { id: { in: categories } },
    });
    if (validCategories.length !== categories.length) {
      return res
        .status(400)
        .json({ message: "One or more categories are invalid" });
    }
    let finalPrice = price;

    if (discount && discount > 0) {
      finalPrice = price * (1 - discount);
    }
    

    const product = await prisma.product.create({
      data: {
        name,
        price,
        finalPrice,
        discount,
        quantity,
        description,
      },
    });
    const productCategories = categories.sort().map((categoryId: number) => ({
      productId: product.id,
      categoryId: categoryId,
    }));

    await prisma.productCategory.createMany({
      data: productCategories,
    });

    return res
      .status(200)
      .json({ message: "Product created successfully", product });
  } catch (error) {
    return res.status(500).json({ message: "Error creating product", error });
  }
};

// findAll product
export const findAllProducts = async (req: Request, res: Response) => {
  try {
    console.log("Product_findall");
    // รับค่าคำค้นหาจาก query params
    const searchQuery = req.query.search as string | undefined;
    const categoryIds = req.query.category as string | string[] | undefined;

    // สร้างตัวแปร where ที่จะใช้ในการค้นหา
    const where: any = {}; // กำหนด where clause แบบ dynamic

    // หากมีคำค้นหาในชื่อสินค้า
    if (searchQuery) {
      where.name = {
        contains: searchQuery.toLowerCase(), // จัดการคำค้นหาด้วยการแปลงเป็นตัวพิมพ์เล็ก
      };
    }

    // หากมีการส่ง category id มาและสามารถส่งมาได้หลายค่า
    if (categoryIds) {
      const categoryFilter = Array.isArray(categoryIds)
        ? categoryIds.map(Number)
        : [Number(categoryIds)];
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
        Image: {
          where: {
            name: "CoverImage", // กรองเฉพาะภาพที่มีชื่อว่า "Cover Image"
          },
          select: {
            imageUrl: true, // แสดงเฉพาะ url ของภาพ
          },
        },
      },
    });

    return res.status(200).json(products);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Error while getting products", error });
  }
};
//getAllProductsByCatIds
export const findAllProductsByCatIds = async (req: Request, res: Response) => {
  try {
    console.log("Product_findAllByCatIds");
    const { id } = req.params;
    const categoryId = parseInt(id);
    if (isNaN(categoryId)) {
      return res.status(400).json({ error: "Invalid categoryId" });
    }
    const product = await prisma.product.findMany({
      where: {
        ProductCategory: {
          some: {
            categoryId: categoryId,
          },
        },
      },
    });

    if (product.length === 0) {
      return res
        .status(404)
        .json({ message: "No products found for this category" });
    }
    return res.json(product);
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
};

//findOneProduct
export const getProductById = async (req: Request, res: Response) => {
  try {
    console.log("Product_getById");
    const { id } = req.params;
    const productId = parseInt(id);

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        ProductCategory: {
          include: { category: true },
        },
        Image: true,
        // ดึงข้อมูลรูปภาพทั้งหมดที่เกี่ยวข้อง
        Review: {
          select: {
            rating: true,
            comments: true,
            user: { select: { username: true } },
          },
        },
      },
    });
    console.log("Product Data:", product);
    // ตรวจสอบว่าพบสินค้าไหม
    if (!product) {
      return res.status(404).json({ message: "ไม่พบสินค้า" });
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
    return res
      .status(500)
      .json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า", error });
  }
};

// edit product
export const editProduct = async (req: Request, res: Response) => {
  try {
    console.log("Product_edit");
    const { id } = req.params;
    const productId = parseInt(id);
    const { name, price, discount, categories, quantity, description } =
      req.body;

    // ตรวจสอบว่ามีสินค้าหรือไม่
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    // ตรวจสอบว่าชื่อสินค้าที่แก้ไขไม่ซ้ำกับสินค้าตัวอื่น
    if (name !== existingProduct.name) {
      const existingProductName = await prisma.product.findUnique({
        where: { name },
      });
      if (
        existingProductName &&
        existingProductName.id !== existingProduct.id
      ) {
        return res.status(400).json({ message: "Product name already exists" });
      }
    }
    let finalPrice = price;

    if (discount && discount > 0) {
      finalPrice = price * (1 - discount);
    }

    // อัปเดตข้อมูลสินค้า
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { name, price, discount, finalPrice, quantity, description },
    });

    // ลบความสัมพันธ์ category ทั้งหมดที่มีอยู่ก่อน
    await prisma.productCategory.deleteMany({
      where: { productId: productId },
    });

    // ตรวจสอบ category ใหม่ว่ามีอยู่ในระบบจริงหรือไม่
    const validCategories = await prisma.category.findMany({
      where: { id: { in: categories } },
    });

    if (validCategories.length !== categories.length) {
      return res
        .status(400)
        .json({ message: "One or more categories are invalid" });
    }

    // สร้างความสัมพันธ์ใหม่ระหว่าง product กับ categories
    const productCategories = categories.map((categoryId: number) => ({
      productId: productId,
      categoryId: categoryId,
    }));

    await prisma.productCategory.createMany({
      data: productCategories,
    });

    // ส่งข้อมูลที่แก้ไขเสร็จแล้วกลับไปยัง client
    return res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct, // ส่งข้อมูล product ที่อัปเดตแล้วกลับไป
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error updating product", error });
  }
};
