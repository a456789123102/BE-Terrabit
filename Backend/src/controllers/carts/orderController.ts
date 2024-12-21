import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const updateOrderStatus = async (req: Request, res: Response) => {
    console.log("order_updateStatus");
    try {
        const { orderId } = req.params; 
        const { status } = req.body;  

        const validStatuses = ["pending", "confirmed", "cancelled"];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({ message: "Invalid status. Valid statuses are: pending, confirmed, cancelled." });
        }
        const existingOrder = await prisma.order.findUnique({ where: { id: Number(orderId) } });
        if (!existingOrder) {
          return res.status(404).json({ message: "Order not found." });
        }

        const updatedOrder = await prisma.order.update({
            where: { id: Number(orderId) },
            data: { status },
        });
        return res.status(200).json({ message: "Order status updated successfully.", updatedOrder });
    } catch (error) {
        console.error("Order status update error:", error);
        return res.status(500).json({ error: "Failed to update order status", details: error });
    }
};

