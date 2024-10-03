import { Request, Response } from 'express';
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

// Find all users
export const getAllUsers = async (req: Request, res: Response) => {
    try {
      const users = await prisma.user.findMany(
        {select: {id: true, email: true, username: true, isAdmin: true,createdAt: true}}
      );
      res.status(200).json(users);  // ส่งข้อมูลเป็น JSON
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error while getting users' });
    }
  };

  //Find Own Users
  export const me = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const users = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, username: true, isAdmin: true, createdAt: true }
      });
      res.status(200).json(users);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error while getting users',error });
    }
  };
  