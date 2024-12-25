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

//get all orders for admin

export const getAllOrders = async (req: Request, res: Response) => {
  console.log("order_getall");
  try {
    // ดึง status จาก query string
    const { status } = req.query;

    console.log(`status: ${status}`);

    // ตรวจสอบและแปลง status เป็น array
    const statuses = typeof status === "string" ? status.split(",") : [];

    // สร้าง filter สำหรับ Prisma
    const statusFilter = statuses.length > 0 ? { status: { in: statuses } } : {};

    // ดึงคำสั่งซื้อจากฐานข้อมูล
    const orders = await prisma.order.findMany({
      where: statusFilter, // ใช้เงื่อนไขสำหรับ status
      include: { items: true }, // ดึงข้อมูล items ที่เกี่ยวข้อง
    });

    // ส่งข้อมูลคำสั่งซื้อกลับ
    return res.status(200).json({ orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({ message: "Failed to fetch orders", error });
  }
};


//get own orders

export const getmyOrder = async (req: Request, res: Response) => {
  console.log("order_getMine");
  try {
    const userId = (req as any).user.id;
    const status = req.params.status;
    console.log(`status:${status}`);

    const validStatuses = ["pending", "confirmed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status. Valid statuses are: pending, confirmed, cancelled." });
    }

    const orders = await prisma.order.findMany({
      where: { 
        userId,
        status,
      },
      include: { items: true },
    });

    // ส่งข้อมูล `orders` โดยตรง
    return res.status(200).json(orders);
  } catch (error) {
    console.error("Error in getmyOrder:", error);
    return res.status(500).json({ message: "Failed to get orders", error });
  }
};
