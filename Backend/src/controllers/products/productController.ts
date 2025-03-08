import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
const levenshtein = require("fast-levenshtein");



const prisma = new PrismaClient();

//create
export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, price, discount, categories, quantity, description } = req.body;
    // ตรวจสอบและแปลงข้อมูล
    const parsedName = name?.replace(/"/g, "").trim();
    const parsedCategories = Array.isArray(categories)
      ? categories
      : JSON.parse(categories || "[]");
    const parsedPrice = parseFloat(price);
    const parsedDiscount = parseFloat(discount)/100;
    const parsedQuantity = parseInt(quantity);
    const parsedDescription = description?.replace(/"/g, "").trim();

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
    const finalPrice = parsedDiscount > 0 ? parsedPrice * (1 - parsedDiscount) : parsedPrice;

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

    return res.status(200).json({
      message: "Product created successfully",
      product,
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

    const finalPrice = discount ? price * (1 - (discount/100)) : price;
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { name, price, discount, finalPrice, quantity, description },
    });


    await prisma.productCategory.deleteMany({ where: { productId } });
    
    const productCategories = categories.map((categoryId: number) => ({
      productId,
      categoryId,
    }));
    await prisma.productCategory.createMany({ data: productCategories });

    return res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct,
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
    const page = Number(req.query.page) || 1; 
    const orderBy = (req.query.orderBy as "asc" | "desc") || "desc";
    const orderWith = (req.query.orderWith as string) || "createdAt";
    
    const pageSize = req.query.pageSize
      ? Number(req.query.pageSize)
      : undefined;
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
      orderBy: {
        [orderWith]: orderBy,
      },
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

///////////////////////////////////////////////////////////////////////////////////////////////////////
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
      },
    });
    // ตรวจสอบว่าพบสินค้าไหม
    if (!product) {
      return res.status(404).json({ message: "ไม่พบสินค้า" });
    }

    // ถ้าไม่มีรูปภาพ ให้ตั้งเป็น array ว่าง
    if (!product.Image) {
      product.Image = [];
    }

    // ถ้าไม่มีรีวิว ให้ตั้งเป็น array ว่าง

    return res.status(200).json(product);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า", error });
  }
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//getAllRelatedProducts
export const getRelatedProducts = async (req: Request, res: Response) => {
  try {
    console.log("PRODUCTS_GETRELATED");

    const productId = parseInt(req.params.productId);
    const categoryIds = req.query.category as string | string[] | undefined;
    const name = req.query.name as string | undefined;

    if (!productId || !categoryIds || !name) {
      return res.status(400).json({ message: "Invalid parameters" });
    }

    const categoryIdsArray = Array.isArray(categoryIds)
      ? categoryIds.map((id) => parseInt(id))
      : [parseInt(categoryIds)];

    const products = await prisma.product.findMany({
      where: {
        id: {
          not: productId,
        },
        AND: [
          {
            ProductCategory: {
              some: {
                categoryId: {
                  in: categoryIdsArray,
                },
              },
            },
          },
        ],
      },
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
      take: 20, // ดึงข้อมูลมากกว่า 5 เพื่อตรวจสอบเพิ่มเติม
    });

    // ✅ คำนวณคะแนนความคล้ายของชื่อโดยใช้ Levenshtein Distance
    const relatedProducts = products
      .map(product => {
        const nameDistance = levenshtein.get(name.toLowerCase(), product.name.toLowerCase());
        const nameScore = 1 - nameDistance / Math.max(name.length, product.name.length); // Normalize เป็น 0-1

        const categoryMatchCount = product.ProductCategory.filter((cat) =>
          categoryIdsArray.includes(cat.categoryId)
        ).length;

        return {
          ...product,
          matchScore: nameScore + categoryMatchCount,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore) // เรียงลำดับคะแนนจากมากไปน้อย
      .slice(0, 4); // จำกัดผลลัพธ์ที่ 4 รายการ
    
    return res.status(200).json({ relatedProducts });
    
  } catch (error) {
    console.error("❌ Error fetching related products:", error);
    return res.status(500).json({
      message: "An error occurred while fetching related products",
      error,
    });
  }
};
//////////////////////////////////////////////////////////
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    console.log("Product_delete");
    const { id } = req.params;
    const productId = parseInt(id);

    // ตรวจสอบว่ามี product ในฐานข้อมูลหรือไม่
    const isExistingProduct = await prisma.product.findFirst({
      where: { id: productId },
    });

    if (!isExistingProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    // ลบข้อมูลในตารางที่เกี่ยวข้อง
    await prisma.review.deleteMany({ where: { productId } });
    await prisma.cart.deleteMany({ where: { productId } });

    await prisma.orderItem.updateMany({
      where: { productId },
      data: { productId: null },
    });
    await prisma.productImage.deleteMany({ where: { productId } }); // ลบ ProductImage
    await prisma.productCategory.deleteMany({ where: { productId } }); // ลบ ProductCategory

    // ลบ Product
    const deletedProduct = await prisma.product.delete({
      where: { id: productId },
    });

    return res.status(200).json({ message: "Delete product success", deletedProduct });
  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json({ message: "Error deleting product", error });
  }
};

