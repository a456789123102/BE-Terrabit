import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { CustomRequest } from "../../middlewares/verify";

const prisma = new PrismaClient();

export const createTicket = async (req: Request, res: Response) => {
    try {
        const { topic, details } = req.body;
        const user = (req as CustomRequest).user;

        // ✅ สร้าง Ticket ใหม่
        const ticket = await prisma.ticket.create({
            data: {
                topic,
                details,
                userId: user.id,
            }
        });

        const admins = await prisma.user.findMany({
            where: { isAdmin: true,
                isActive: true
             },
            select: { id: true } 
        });

        const adminIds = admins.map(admin => admin.id);

        await Promise.all(
            adminIds.map(adminId =>
                prisma.notification.create({
                    data: {
                        userId: adminId,
                        message: `New ticket created: #${ticket.id} - ${topic}`,
                        url: ``,
                    }
                })
            )
        );

        return res.status(201).json(ticket);
    } catch (error) {
        console.error("Error creating ticket:", error);
        return res.status(500).json({ message: "Error creating ticket", error });
    }
};
