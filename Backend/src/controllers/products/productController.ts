import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { handleProductImages } from "./productImageController";

const prisma = new PrismaClient();
type ProductImage = {
  id: number;
  name: string;
  imageUrl: string;
  productId: number;
  createdAt: Date;
  updatedAt: Date;
};

// Create product
// export const createProduct = async (req: Request, res: Response) => {
//   try {
//     console.log("Product_create");

//     const { name, price, discount, categories, quantity, description } =
//       req.body;
//     const files = req.files as Express.Multer.File[];
//     console.log("req.body:", req.body);
//     console.log("req.files:", req.files);
//     if (
//       !name?.trim() ||
//       price === undefined ||
//       !Array.isArray(categories) ||
//       categories.length === 0 ||
//       quantity === undefined ||
//       !description?.trim()
//     ) {
//       return res.status(400).json({ message: "All fields are required" });
//     }

//     const existingProduct = await prisma.product.findUnique({
//       where: { name },
//     });
//     if (existingProduct) {
//       return res.status(400).json({ message: "Product name already exists" });
//     }

//     const validCategories = await prisma.category.findMany({
//       where: { id: { in: categories } },
//     });
//     if (validCategories.length !== categories.length) {
//       return res
//         .status(400)
//         .json({ message: "One or more categories are invalid" });
//     }

//     let finalPrice = price;
//     if (discount && discount > 0) {
//       finalPrice = price * (1 - discount);
//     }

//     const product = await prisma.product.create({
//       data: {
//         name,
//         price,
//         finalPrice,
//         discount,
//         quantity,
//         description,
//       },
//     });

//     const productCategories = categories.map((categoryId: number) => ({
//       productId: product.id,
//       categoryId,
//     }));
//     await prisma.productCategory.createMany({ data: productCategories });

//     let uploadedImages: ProductImage[] = [];
//     if (files && files.length > 0) {
//       uploadedImages = await handleProductImages(files, product.id);
//     }

//     return res.status(200).json({
//       message: "Product created successfully",
//       product,
//       images: uploadedImages,
//     });
//   } catch (error) {
//     console.error("Error creating product:", error);
//     return res.status(500).json({ message: "Error creating product", error });
//   }
// };

export const createProduct = async (req: Request, res: Response) => {
  try {
    console.log("Product_create");

    const { name, price, discount, categories, quantity, description } =
      req.body;

    console.log("req.body:", req.body);
    console.log("req.files:", req.files);

    // ตรวจสอบและแปลงข้อมูล
    const parsedName = name?.replace(/"/g, "").trim();
    const parsedCategories = Array.isArray(categories)
      ? categories
      : JSON.parse(categories || "[]");
    const parsedPrice = parseFloat(price);
    const parsedDiscount = parseFloat(discount);
    const parsedQuantity = parseInt(quantity);
    const parsedDescription = description?.replace(/"/g, "").trim();

    // ตรวจสอบว่าข้อมูลครบถ้วน
    if (
      !parsedName ||
      isNaN(parsedPrice) ||
      !Array.isArray(parsedCategories) ||
      parsedCategories.length === 0 ||
      isNaN(parsedQuantity) ||
      !parsedDescription
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // ตรวจสอบว่ามีชื่อสินค้าซ้ำหรือไม่
    const existingProduct = await prisma.product.findUnique({
      where: { name: parsedName },
    });
    if (existingProduct) {
      return res.status(400).json({ message: "Product name already exists" });
    }

    // ตรวจสอบว่า categories มีอยู่ในระบบจริงหรือไม่
    const validCategories = await prisma.category.findMany({
      where: { id: { in: parsedCategories } },
    });
    if (validCategories.length !== parsedCategories.length) {
      return res
        .status(400)
        .json({ message: "One or more categories are invalid" });
    }

    // คำนวณ finalPrice
    let finalPrice = parsedPrice;
    if (parsedDiscount && parsedDiscount > 0) {
      finalPrice = parsedPrice * (1 - parsedDiscount);
    }

    // สร้างสินค้าในฐานข้อมูล
    const product = await prisma.product.create({
      data: {
        name: parsedName,
        price: parsedPrice,
        finalPrice,
        discount: parsedDiscount,
        quantity: parsedQuantity,
        description: parsedDescription,
      },
    });

    // สร้างความสัมพันธ์ระหว่าง product และ categories
    const productCategories = parsedCategories.map((categoryId: number) => ({
      productId: product.id,
      categoryId,
    }));
    await prisma.productCategory.createMany({ data: productCategories });

    // ตรวจสอบว่ามีไฟล์หรือไม่
    const uploadedImages = await handleProductImages(req.files as Express.Multer.File[], product.id);

    return res.status(200).json({
      message: "Product created successfully",
      product,
      images: uploadedImages,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    return res.status(500).json({ message: "Error creating product", error });
  }
};


////////////////////////////////////////////////////////////////////////////////////////////////
// Edit product
export const editProduct = async (req: Request, res: Response) => {
  try {
    console.log("Product_edit");

    const { id } = req.params;
    const productId = parseInt(id);
    const { name, price, discount, categories, quantity, description } =
      req.body;
      const parsedName = name?.replace(/"/g, "").trim();
      const parsedCategories = Array.isArray(categories)
        ? categories
        : JSON.parse(categories || "[]");
      const parsedPrice = parseFloat(price);
      const parsedDiscount = parseFloat(discount);
      const parsedQuantity = parseInt(quantity);
      const parsedDescription = description?.replace(/"/g, "").trim();
    const files = req.files as Express.Multer.File[];

    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    const validCategories = await prisma.category.findMany({
      where: { id: { in: categories } },
    });
    if (validCategories.length !== categories.length) {
      return res
        .status(400)
        .json({ message: "One or more categories are invalid" });
    }

    const finalPrice = discount ? price * (1 - discount) : price;
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { name, price, discount, finalPrice, quantity, description },
    });

    let uploadedImages: ProductImage[] = [];
    if (files && files.length > 0) {
      uploadedImages = await handleProductImages(files, productId);
    }

    await prisma.productCategory.deleteMany({ where: { productId } });
    const productCategories = categories.map((categoryId: number) => ({
      productId,
      categoryId,
    }));
    await prisma.productCategory.createMany({ data: productCategories });

    return res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct,
      images: uploadedImages,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    return res.status(500).json({ message: "Error updating product", error });
  }
};


//////////////////////////////////////////////////////////////////////////////////////////////////////////////

// findAll product
export const findAllProducts = async (req: Request, res: Response) => {
  try {
    console.log("Product_findall");

    const searchQuery = req.query.search as string | undefined;
    const categoryIds = req.query.category as string | string[] | undefined;
    const page = Number(req.query.page) || 1; // แปลง page เป็น Number หากไม่มีค่าให้ใช้เป็น 1
    const sortBy = req.query.sortBy as string | undefined;
    const sortOrder = req.query.sortOrder === "desc" ? "desc" : "asc";
    const pageSize = req.query.pageSize
      ? Number(req.query.pageSize)
      : undefined;
    console.log(`pagesize in BE: ${pageSize}`);
    const where: any = {};

    if (searchQuery) {
      where.name = {
        contains: searchQuery.toLowerCase(),
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
            in: categoryFilter,
          },
        },
      };
    }

    const offset = pageSize ? (page - 1) * pageSize : undefined;

    const products = await prisma.product.findMany({
      skip: offset,
      take: pageSize,
      orderBy: sortBy ? { [sortBy]: sortOrder } : undefined,
      where,
      include: {
        ProductCategory: {
          include: {
            category: true,
          },
        },
        Image: {
          where: {
            name: "CoverImage",
          },
          select: {
            imageUrl: true,
          },
        },
      },
    });

    const totalProducts = await prisma.product.count({
      where,
    });

    const totalPages = pageSize ? Math.ceil(totalProducts / pageSize) : 1;

    // ส่งข้อมูลสินค้าพร้อมกับข้อมูล pagination
    return res.status(200).json({
      products,
      pagination: {
        page,
        pageSize,
        totalProducts,
        totalPages,
      },
    });
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

// // edit product
// export const editProduct = async (req: Request, res: Response) => {
//   try {
//     console.log("Product_edit");
//     const { id } = req.params;
//     const productId = parseInt(id);
//     const { name, price, discount, categories, quantity, description } =
//       req.body;
//     const files = req.files as Express.Multer.File[];
//     // ตรวจสอบว่ามีสินค้าหรือไม่
//     const existingProduct = await prisma.product.findUnique({
//       where: { id: productId },
//     });
//     if (!existingProduct) {
//       return res.status(404).json({ message: "Product not found" });
//     }

//     // ตรวจสอบว่าชื่อสินค้าที่แก้ไขไม่ซ้ำกับสินค้าตัวอื่น
//     if (name !== existingProduct.name) {
//       const existingProductName = await prisma.product.findUnique({
//         where: { name },
//       });
//       if (
//         existingProductName &&
//         existingProductName.id !== existingProduct.id
//       ) {
//         return res.status(400).json({ message: "Product name already exists" });
//       }
//     }
//     let finalPrice = price;

//     if (discount && discount > 0) {
//       finalPrice = price * (1 - discount);
//     }

//     // อัปเดตข้อมูลสินค้า
//     const updatedProduct = await prisma.product.update({
//       where: { id: productId },
//       data: { name, price, discount, finalPrice, quantity, description },
//     });

//     let uploadedImages = [];
//     if (files && files.length > 0) {
//       uploadedImages = await handleProductImages(files, productId);
//     }

//     // ลบความสัมพันธ์ category ทั้งหมดที่มีอยู่ก่อน
//     await prisma.productCategory.deleteMany({
//       where: { productId: productId },
//     });

//     // ตรวจสอบ category ใหม่ว่ามีอยู่ในระบบจริงหรือไม่
//     const validCategories = await prisma.category.findMany({
//       where: { id: { in: categories } },
//     });

//     if (validCategories.length !== categories.length) {
//       return res
//         .status(400)
//         .json({ message: "One or more categories are invalid" });
//     }

//     // สร้างความสัมพันธ์ใหม่ระหว่าง product กับ categories
//     const productCategories = categories.map((categoryId: number) => ({
//       productId: productId,
//       categoryId: categoryId,
//     }));

//     await prisma.productCategory.createMany({
//       data: productCategories,
//     });

//     // ส่งข้อมูลที่แก้ไขเสร็จแล้วกลับไปยัง client
//     return res.status(200).json({
//       message: "Product updated successfully",
//       product: updatedProduct,
//       images: uploadedImages // ส่งข้อมูล product ที่อัปเดตแล้วกลับไป
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: "Error updating product", error });
//   }
// };
