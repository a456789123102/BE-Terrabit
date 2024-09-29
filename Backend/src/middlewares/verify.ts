import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { error } from "console";

const prisma = new PrismaClient();
//User?
export type CustomRequest = Request & { user: { id: number, isAdmin: boolean} };



export const verifyUser = (req: Request, res: Response,next: NextFunction) => {
try {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).send({message: "Invalid token in verify process"})
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY!);
    (req as CustomRequest).user = decoded as any;
    next();
} catch (error) {
    res.status(500).json({ message: "Error While verifying token",error });
}
};
//Admin?
export const verifyAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
        return res.status(401).send({ message: "Invalid token in verify process" });
      }
  
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY!) as { id: number };
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  
      if (!user) {
        return res.status(404).send({ message: "User not found" });
      }
  
      if (!user.isAdmin) {
        return res.status(403).send({ message: "You do not have Permission to view this data" });
      }
  
      (req as CustomRequest).user = { id: user.id, isAdmin: user.isAdmin };
      next();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error while verifying token",error });
    }
  };

  //buyed???
  export const verifyPurchase = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { productId } = req.body;
      const userId = (req as CustomRequest).user.id;
  
      if (!userId || !productId) {
        return res.status(400).json({ message: "Invalid product or user" });
      }
  
      const order = await prisma.orderItem.findFirst({
        where: {
          productId: productId,
          order: {
            userId: userId,
            status: "completed",
          },
        },
      });
  
      if (!order) {
        return res.status(403).json({ message: 'You need to purchase this product before leaving a review' });
      }
  
      next();
    } catch (error) {
      return res.status(400).json({ message: "Error while verifying purchase", error });
    }
  };
  