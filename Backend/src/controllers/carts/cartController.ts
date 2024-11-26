import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
//create
export const createCart = async (req: Request, res: Response) => {
  console.log("Cart_create");
  try {
    const userId = (req as any).user.id;
    console.log("userID:"+userId)
    if (isNaN(userId)) {
      
        return res.status(400).json({ message: "Invalid userId. It must be a number." });
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
      return res.status(200).json({ message: "Updated existing item", updatedItem });
    }
    const newCart = await prisma.cart.create({
      data: { userId, productId, quantity, totalPrice },
    });
    return res.status(201).json({ message: "Added new item to cart", newCart });
  } catch (error) {
    return res.status(500).json({ error: "Failed to add to cart", details: error });
  }
};

//getAllwebCart for statregic
export const getAllCart =  async (req:Request, res:Response) => {
    console.log("Cart_getAll")
    try {
      console.log("req.params:", req.params);
        const cartItems = await prisma.cart.findMany({});
        return res.status(200).json(cartItems)
    } catch (error) {
        return res.status(500).json({ error: "Failed to get cart", details: error })
    }
}

//getPersonalcart
export const getPersonalCart = async (req:Request, res:Response) =>{
    console.log("Cart_getPersonal")
    try {
      const userId = (req as any).user.id;
        if (isNaN(userId)) {
            console.log("req.params:", req.params);
            return res.status(400).json({ message: "Invalid userId. It must be a number.",userId });
        }
        const cartItems = await prisma.cart.findMany({
            where: { userId},
            include: {
              product: true, // ดึงข้อมูลจากตาราง Product ที่สัมพันธ์กับ Cart
          },
        });
        return res.status(200).json(cartItems);
    } catch (error) {
        return res.status(500).json({ error: "Failed to get personal cart", details: error })
    }
}

//deleteCart
export const deleteCart = (req:Request, res:Response) => {

};

//checkout
export const checkoutCart = async (req:Request, res:Response) => {
  console.log("cart_checkout");
  try {
    const userId = (req as any).user.id;
    //pull all cart item thats not checkout;
    const cartItems = await prisma.cart.findMany({
      where: { userId, isCheckedOut: false },
    });
    if (cartItems.length === 0) {
      return res.status(400).json({ message: "No items in cart to checkout." });
    }
    //calculate total price
    const totalPrice = cartItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

    //สร้าง order
    const newOrder = await prisma.order.create({
      data: { userId, 
        totalPrice,
      status: "pending"
      },
    });
    //สร้าง orderItem ของแต่ละสินค้า
    const orderItems = cartItems.map((item) => ({
      orderId: newOrder.id,
      productId: item.productId,
      quantity: item.quantity,
      price: item.totalPrice || 0, // ใช้ราคาที่ถูกบันทึกใน cart
    }));
     // อัปเดต Cart ให้ isCheckedOut เป็น true
     await prisma.cart.updateMany({
      where: { userId, isCheckedOut: false },
      data: { isCheckedOut: true },
    });
    await prisma.orderItem.createMany({
      data: orderItems,
    });
    return res.status(201).json({ message: "Checkout successful", order: newOrder });
  } catch (error) {
    console.error("Checkout error:", error);
    return res.status(500).json({ error: "Failed to checkout", details: error });
  }
}