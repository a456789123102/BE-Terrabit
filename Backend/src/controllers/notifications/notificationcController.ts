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
      userIds.map((userId) =>
        prisma.notification.create({
          data: { userId, message, url: url || null },
        })
      )
    );

    return res.status(201).json({ success: true, notifications });
  } catch (error) {
    console.error(" Error creating notifications:", error);
    return res
      .status(500)
      .json({ message: "Error creating notifications", error });
  }
};

export const getOwnNotifications = async (req: Request, res: Response) => {
  try {
    const user = (req as CustomRequest).user;

    const notifications = await prisma.notification.findMany({
      where: {
        userId: user.id,

      },
      orderBy: { updatedAt: "desc" },
    });

    const countNotifications = await prisma.notification.count({
      where: {
        userId: user.id,
      },
    });

    return res.status(200).json({ notifications, total: countNotifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res
      .status(500)
      .json({ message: "Error fetching notifications", error });
  }
};

// export const markNotificationAsRead = async (req: Request, res: Response) => {
//     try {
//         const { notificationId } = req.body;

//         if (!Array.isArray(notificationId) || notificationId.length === 0) {
//             return res.status(400).json({ message: "notificationId is required" });
//         }

//         await prisma.notification.updateMany({
//             where: { id: { in: notificationId } },
//             data: { isRead: true },
//         });

//         return res.status(200).json({ success: true, message: "Notification marked as read." });
//     } catch (error) {
//         console.error("Error marking notification as read:", error);
//         return res.status(500).json({ message: "Error updating notification", error});
//     }
// };

export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as CustomRequest).user.id;
    const notificationId = parseInt(id);

    const isValid = await prisma.notification.findFirst({
        where: { id: notificationId, userId },
      });
    if (!isValid) {
        return res.status(404).json({ message: "Notification not found" });
    }
    await prisma.notification.delete({
      where: { id:notificationId, userId },
    });
    return res.status(200).json({ message: "Notification deleted successfully." });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return res
     .status(500)
     .json({ message: "Error deleting notification", error });
  }
};

export const deleteAllNotification = async (req: Request, res: Response) => {
  try {
    const userId = (req as CustomRequest).user.id;
    const notifications = await prisma.notification.count({
      where: { userId },
    });

    await prisma.notification.deleteMany({
      where: { userId },
    });
    return res.status(200).json({ message: `${notifications} Notification deleted successfully.` });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return res
     .status(500)
     .json({ message: "Error deleting notification", error });
  }
};

