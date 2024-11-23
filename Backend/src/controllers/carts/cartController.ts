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
        });
        return res.status(200).json(cartItems);
    } catch (error) {
        return res.status(500).json({ error: "Failed to get personal cart", details: error })
    }
}