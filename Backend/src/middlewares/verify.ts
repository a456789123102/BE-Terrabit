import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
//User?
export type CustomRequest = Request & {
  user: { id: number; userName: string; isAdmin?: boolean };
};

export const verifyUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).send({ message: "Invalid token in verify process" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY!) as {
      id: number;
    };

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    if (!user.isActive) {
      return res
       .status(401)
       .send({ message: "User account is deactivated. Please contact support." });
    }

    // ✅ เก็บ user ไว้ใน req แต่ไม่ต้องมี isAdmin
    (req as CustomRequest).user = {
      id: user.id,
      userName: user.username, // ป้องกันการส่งค่า undefined
    };

    next();
  } catch (error) {
    console.error("Error while verifying token:", error);
    res.status(500).json({ message: "Error while verifying token", error });
  }
};

//Admin?
export const verifyAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      return res
        .status(401)
        .send({ message: "Invalid token in verify process" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY!) as {
      id: number;
    };
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    if (!user.isAdmin) {
      return res
        .status(403)
        .send({ message: "You do not have Permission to Access this request" });
    }
    if (!user.isActive) {
      return res
       .status(401)
       .send({ message: "User account is deactivated. Please contact support." });
    }


    (req as CustomRequest).user = {
      id: user.id,
      userName: user.username,
      isAdmin: user.isAdmin,
    };
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error while verifying token", error });
  }
};

//buyed???
export const verifyPurchase = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.body;
    if(!productId) return res.status(404).json({ message: "Invalid product ID" });
    const userId = (req as CustomRequest).user.id;

    if (!userId || !productId) {
      return res.status(400).json({ message: "Invalid product or user" });
    }

    const order = await prisma.orderItem.findFirst({
      where: {
        productId: productId,
        order: {
          userId: userId,
          status: "payment_verified",
        },
      },
    });

    if (!order) {
      return res
        .status(403)
        .json({
          message: "You need to purchase this product before leaving a review",
        });
    }

    next();
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Error while verifying purchase", error });
  }
};

export const verifyOptionalUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY!) as {
        id: number;
      };
      (req as CustomRequest).user = decoded as any;
      next();
    }else{
      next();
    }
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error while verifying token", error });
  }
};

