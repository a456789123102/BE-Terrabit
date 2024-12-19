import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
//create
export const createCart = async (req: Request, res: Response) => {
  console.log("Cart_create");
  try {
    const userId = (req as any).user.id;
    console.log("userID:" + userId);
    if (isNaN(userId)) {
      return res
        .status(400)
        .json({ message: "Invalid userId. It must be a number." });
    }
    const { productId, quantity, totalPrice } = req.body;
    const cartItem = await prisma.cart.findFirst({
      where: { userId, productId },
    });
    if (cartItem) {
      const updatedItem = await prisma.cart.update({
        where: { id: cartItem.id },
        data: {
          quantity: cartItem.quantity + quantity,
          totalPrice: cartItem.totalPrice + totalPrice,
        },
      });
      return res
        .status(200)
        .json({ message: "Updated existing item", updatedItem });
    }
    const newCart = await prisma.cart.create({
      data: { userId, productId, quantity, totalPrice },
    });
    return res.status(201).json({ message: "Added new item to cart", newCart });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Failed to add to cart", details: error });
  }
};
//update quantity
export const updateQuantity = async (req: Request, res: Response) => {
  console.log("Cart_update");
  try {
    const cartId = Number(req.params.id);

    // Validate cartId
    if (isNaN(cartId)) {
      return res.status(400).json({ error: "Invalid cart ID" });
    }

    const isExistingCart = await prisma.cart.findUnique({ where: { id: cartId } });
    if (!isExistingCart) return res.status(404).json({ error: "Cart not found" });

    const { quantity } = req.body;

    // Validate quantity
    if (typeof quantity !== 'number' || quantity <= 0) {
      return res.status(400).json({ error: "Invalid quantity" });
    }

    await prisma.cart.update({
      where: { id: cartId },
      data: { quantity }
    });

    return res.status(200).json({ message: `Updated cart ID: ${cartId} quantity: ${quantity}` });
  } catch (error) {
    console.error(error);  // Log the error for better debugging
    return res.status(500).json({ message: "Internal server error", error });
  }
};


//getAllwebCart for statregic
export const getAllCart = async (req: Request, res: Response) => {
  console.log("Cart_getAll");
  try {
    const cartItems = await prisma.cart.findMany({});
    return res.status(200).json(cartItems);
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Failed to get cart", details: error });
  }
};

//getPersonalcart
export const getPersonalCart = async (req: Request, res: Response) => {
  console.log("Cart_getPersonal");
  try {
    const userId = (req as any).user.id;
    if (isNaN(userId)) {
      return res
        .status(400)
        .json({ message: "Invalid userId. It must be a number.", userId });
    }
    const cartItems = await prisma.cart.findMany({
      where: { userId },
      include: {
        product: true, // ดึงข้อมูลจากตาราง Product ที่สัมพันธ์กับ Cart
      },
    });
    return res.status(200).json(cartItems);
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Failed to get personal cart", details: error });
  }
};

//deleteCart
export const deleteCart = async (req: Request, res: Response) => {
  console.log("cart_delete");
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "ID is required" });
    }
    if (!userId) return res.status(400).json({ message: "user is required" });
    const existProductCart = await prisma.cart.findUnique({
      where: { id: Number(id) },
    });
    if (!existProductCart)
      return res.status(404).json({ message: "product not found" });

    await prisma.cart.delete({
      where: { id: Number(id), userId: userId },
    });
    return res.status(200).json({ message: "Deleted cart item", id });
  } catch (error) {
    return res.status(500).json({ message: "some error in backend", error });
  }
};

//checkout
export const checkout = async (req: Request, res: Response) => {
  console.log("cart_checkout");
try {
  const userId = (req as any).user.id;
  if (!userId) return res.status(400).json({ message: "user is required" });


  const cartItems = await prisma.cart.findMany({
    where: { 
      userId, 
      isCheckedOut: false 
    },
  });
  if (cartItems.length === 0){
    return res.status(400).json({ message: "No valid cart items found to checkout." });
  }

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + (item.totalPrice || 0),
    0
  );

// สร้าง order ใหม่
const newOrder = await prisma.order.create({
  data: { userId, totalPrice, status: "pending" },
});
// สร้าง orderItems จาก cartItems
const orderItems = cartItems.map((item) => ({
  orderId: newOrder.id,
  productId: item.productId,
  quantity: item.quantity,
  price: item.totalPrice || 0, // ราคาจาก cart
}));
await prisma.orderItem.createMany({
  data: orderItems,
});

    // อัปเดต Cart ให้เป็น CheckedOut
    await prisma.cart.updateMany({
      where: { 
        userId, 
        isCheckedOut: false 
      }, // เงื่อนไข
      data: { isCheckedOut: true }, // ค่าใหม่
    });

} catch (error) {
  console.error("Checkout error:", error);
  return res.status(500).json({ error: "Failed to checkout", details: error });
}
};
