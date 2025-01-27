import { Request, Response } from 'express';
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

// Find all users
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    console.log("user_getAll");

    // Query Parameters
    const search = req.query.search as string | undefined;
    const sortBy = (req.query.sortBy as string | undefined) || "createdAt"; // Default to "createdAt"
    const sortOrder = req.query.sortOrder === "desc" ? "desc" : "asc"; // Default to ascending order
    const page = Math.max(Number(req.query.page) || 1, 1); // Default to 1, ensure >= 1
    const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 10, 1), 100); // Default to 10, max 100
    const offset = (page - 1) * pageSize;

    // Prisma Query
    const users = await prisma.user.findMany({
      skip: offset,
      take: pageSize,
      where: {
        username: search ? { contains: search.toLowerCase()} : undefined,
      },
      orderBy: {
        [sortBy]: sortOrder,
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
        pageSize,
        totalUsers,
        totalPages,
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
  