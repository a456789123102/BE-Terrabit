import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createCart = async (req: Request, res: Response) => {
  console.log("Cart_create");
  try {
    const { userId, productId, quantity, totalPrice } = req.body;
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
    return res.status(200).json({ message: "Added new item to cart", newCart });
  } catch (error) {
    return res.status(500).json({ error: "Failed to add to cart", details: error });
  }
};
