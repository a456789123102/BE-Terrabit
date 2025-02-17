import { Request, Response } from 'express';
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

// Find all users
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    console.log("user_getAll");

    // Query Parameters
    const search = req.query.search as string | undefined;
    const orderBy = (req.query.orderBy as "asc" | "desc") || "desc";
    const orderWith = (req.query.orderWith as string) || "createdAt";
    
    const page = Math.max(Number(req.query.page) || 1, 1); 
    const isActiveParam = req.query.isActive as string ;
    const isActive =
    isActiveParam !== undefined ? isActiveParam === "true" : undefined;
    const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 10, 1), 100); // Default to 10, max 100
    const offset = (page - 1) * pageSize;

    // Prisma Query
    const users = await prisma.user.findMany({
      skip: offset,
      take: pageSize,
      where: {
        username: search ? { contains: search.toLowerCase() } : undefined,
        isActive: isActive !== undefined ? isActive : undefined,  // ✅ แก้ไขตรงนี้
      },
      orderBy: {
        [orderWith]: orderBy,
      },
      select:{
        id: true,
        email: true,
        username: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    
    const totalUsers = await prisma.user.count({
      where: {
        username: search ? { contains: search.toLowerCase()} : undefined,
      },
    });

    const totalPages = Math.ceil(totalUsers / pageSize);

    // Respond with JSON
    res.status(200).json({
      users,
      pagination: {
        page,
        totalPages,
        pageSize,
        totalUsers,
      },
    });
  } catch (error) {
    console.error("Error while getting users:", error);
    res.status(500).json({ message: "Error while getting users" });
  }
};


  //Find Own Users
  export const me = async (req: Request, res: Response) => {
    try {
      console.log("user_me")
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
  