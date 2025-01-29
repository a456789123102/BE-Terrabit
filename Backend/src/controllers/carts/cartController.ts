import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
//create
export const createCart = async (req: Request, res: Response) => {
  console.log("Cart_create");
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized: Invalid or missing token" });
    console.log("userID:" + userId);
    if (isNaN(userId)) {
      return res
        .status(400)
        .json({ message: "Invalid userId. It must be a number." });
    }
    const { productId, quantity, totalPrice } = req.body;
    console.log("productID:" + productId);
    console.log("quantity:" + quantity);
    console.log("totalPrice:" + totalPrice);
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

    const isExistingCart = await prisma.cart.findUnique({
      where: { id: cartId },
    });
    if (!isExistingCart)
      return res.status(404).json({ error: "Cart not found" });

    const { quantity } = req.body;

    // Validate quantity
    if (typeof quantity !== "number" || quantity <= 0) {
      return res.status(400).json({ error: "Invalid quantity" });
    }

    await prisma.cart.update({
      where: { id: cartId },
      data: { quantity },
    });

    return res
      .status(200)
      .json({ message: `Updated cart ID: ${cartId} quantity: ${quantity}` });
  } catch (error) {
    console.error(error); // Log the error for better debugging
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
        product: {
          include: {
            Image: {
              where: {
                name: "CoverImage", // Filter to only include the cover image
              },
            },
          },
        },
      },
    });

    // Log the result to check the structure
    console.log(`cartItems:`, cartItems);

    // Map the cart items to include the cover image in the response
    const result = cartItems.map((cartItem) => ({
      ...cartItem,
      product: {
        ...cartItem.product,
        CoverImage: cartItem.product?.Image?.[0]?.imageUrl || null, // Extract the image URL
      },
    }));

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching personal cart:", error);
    return res
      .status(500)
      .json({ error: "Failed to get personal cart", details: error });
  }
};


//deleteCartItems
export const deleteOneCartItem = async (req: Request, res: Response) => {
  console.log("cart_deleteOne");
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

//delete all cart Items
export const clearCartItems = async (req: Request, res: Response) => {
  console.log("cart_clear");
try {
  const userId = (req as any).user.id;
  if (!userId) return res.status(400).json({ message: "user is required" });
  await prisma.cart.deleteMany({
    where: { userId },
  });
  return res.status(200).json({ message: "Cleared all cart items" });
} catch (error) {
 return res.status(500).json({message:"something went wron in backend",error}) 
}
}

//checkout///////////////////////////////////////////////////////////////////////////////////////////////
export const checkout = async (req: Request, res: Response) => {
  console.log("cart_checkout");
  try {
    const userId = (req as any).user.id;
    if (!userId) return res.status(400).json({ message: "User is required" });

    const cartItems = await prisma.cart.findMany({
      where: { userId },
    });
    if (cartItems.length === 0) {
      return res
        .status(400)
        .json({ message: "No valid cart items found to checkout." });
    }

    const totalPrice = cartItems.reduce(
      (sum, item) => sum + (item.totalPrice || 0),
      0
    );

    // Create new order
    const newOrder = await prisma.order.create({
      data: { userId, totalPrice },
    });

    // Create orderItems from cartItems
    const orderItems = await Promise.all(
      cartItems.map(async (item) => {
        if (!item.productId || item.productId <= 0) {
          throw new Error(`Cart item with invalid productId: ${item.productId}`);
        }
        
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
        });
        ;
        

        if (!product || !product.name) {
          throw new Error(
            `Product with ID ${item.productId} not found or does not have a valid name`
          );
        }

        return {
          orderId: newOrder.id,
          productId: item.productId,
          productName: product.name, // Ensure this value is valid
          quantity: item.quantity,
          price: item.totalPrice || 0,
        };
      })
    );

    // Batch insert order items
    await prisma.orderItem.createMany({
      data: orderItems,
    });

    // Clear the cart
    await prisma.cart.deleteMany({
      where: { userId },
    });

    return res.status(200).json({ message: "Checkout successful", newOrder });
  } catch (error) {
    console.error("Checkout error:", error);
    return res
      .status(500)
      .json({ error: "Failed to checkout", details: error});
  }
};



