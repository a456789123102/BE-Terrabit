import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { CustomRequest } from "../../middlewares/verify";

const prisma = new PrismaClient();

export const createNotifications = async (req: Request, res: Response) => {
    try {
        const { userIds, message, url } = req.body;

        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ message: "userIds is empty" });
        }

        const notifications = await Promise.all(
            userIds.map(userId =>
                prisma.notification.create({
                    data: { userId, message, url: url || null }
                })
            )
        );

        return res.status(201).json({ success: true, notifications });
    } catch (error) {
        console.error(" Error creating notifications:", error);
        return res.status(500).json({ message: "Error creating notifications",error});
    }
};

export const getOwnNotifications = async (req: Request, res: Response) => {
    try {
        const user = (req as CustomRequest).user;
        const searchQuery = req.query.search as string | undefined;
        const page = Number(req.query.page) || 1; 
        const pageSize = Number(req.query.pageSize) || 10;
        const isRead = req.query.isRead ? req.query.isRead === "true" : undefined;
        const offset = pageSize ? (page - 1) * pageSize : undefined;

        const notifications = await prisma.notification.findMany({
            skip: offset,
            take: pageSize,
            where: { 
                userId: user.id ,
                isRead: isRead, 
                message: searchQuery ? {  contains: searchQuery.toLowerCase()} : undefined 
            }, 
            orderBy: { updatedAt: "desc" }, 
        });

        return res.status(200).json(notifications);
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return res.status(500).json({ message: "Error fetching notifications", error});
    }
};

export const markNotificationAsRead = async (req: Request, res: Response) => {
    try {
        const { notificationId } = req.body;

        if (!Array.isArray(notificationId) || notificationId.length === 0) {
            return res.status(400).json({ message: "notificationId is required" });
        }

        await prisma.notification.updateMany({
            where: { id: { in: notificationId } },
            data: { isRead: true },
        });

        return res.status(200).json({ success: true, message: "Notification marked as read." });
    } catch (error) {
        console.error("Error marking notification as read:", error);
        return res.status(500).json({ message: "Error updating notification", error});
    }
};
