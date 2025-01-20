import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import exp from "constants";

const prisma = new PrismaClient();

export const updateOrderStatusByUser = async (req: Request, res: Response) => {
  console.log("order_updateStatus");
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "awaiting_slip_upload",
      "awaiting_confirmation",
      "awaiting_rejection",
      "order_cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res
        .status(400)
        .json({
          message:
            "Invalid status. Valid statuses are: pending, confirmed, cancelled.",
        });
    }
    const existingOrder = await prisma.order.findUnique({
      where: { id: Number(orderId) },
    });
    if (!existingOrder) {
      return res.status(404).json({ message: "Order not found." });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: Number(orderId) },
      data: { status },
    });
    return res
      .status(200)
      .json({ message: "Order status updated successfully.", updatedOrder });
  } catch (error) {
    console.error("Order status update error:", error);
    return res
      .status(500)
      .json({ error: "Failed to update order status", details: error });
  }
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
export const updateOrderStatusByAdmin = async (req: Request, res: Response) => {
  console.log("order_updateStatus");
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "awaiting_slip_upload",
      "awaiting_confirmation",
      "awaiting_rejection",
      "order_approved",
      "order_rejected",
      "order_cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res
        .status(400)
        .json({
          message:
            "Invalid status. Valid statuses are: pending, confirmed, cancelled.",
        });
    }
    const existingOrder = await prisma.order.findUnique({
      where: { id: Number(orderId) },
    });
    if (!existingOrder) {
      return res.status(404).json({ message: "Order not found." });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: Number(orderId) },
      data: { status },
    });
    return res
      .status(200)
      .json({ message: "Order status updated successfully.", updatedOrder });
  } catch (error) {
    console.error("Order status update error:", error);
    return res
      .status(500)
      .json({ error: "Failed to update order status", details: error });
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
    const statusFilter =
      statuses.length > 0 ? { status: { in: statuses } } : {};

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

    const validStatuses = [
      "awaiting_slip_upload",
      "awaiting_confirmation",
      "awaiting_rejection",
      "order_approved",
      "order_rejected",
      "order_cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res
        .status(400)
        .json({
          message:
            "Invalid status. Valid statuses are: pending, confirmed, cancelled.",
        });
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
//get order by just Id  will delete soon
export const getOrderById = async (req: Request, res: Response) => {
  console.log("order_getById");
  try {
    const userId = (req as any).user.id;
    const orderId = Number(req.params.orderId);
    if (!orderId) return res.status(400).json({ message: "No order Id" });
    const order = await prisma.order.findUnique({
      where: { id: orderId, userId: userId },
      include: { items: true },
    });
    if (!order) return res.status(404).json({ message: "Order not found" });
    return res.status(200).json(order);
  } catch (error) {
    console.error("Error in getOrderById:", error);
    return res.status(500).json({ message: "Failed to get order by Id", error });
  }
};

// delete order
export const deleteOrder = async (req: Request, res: Response) => {
  console.log("order_delete");
  try {
    const userId = (req as any).user.id;
    const { orderId } = req.params;

    const existingOrder = await prisma.order.findUnique({
      where: { id: Number(orderId), userId },
    });

    if (!existingOrder) {
      return res.status(404).json({ message: "Order not found." });
    }

    await prisma.order.delete({
      where: { id: Number(orderId) },
    });

    return res.status(200).json({ message: "Order deleted successfully." });
  } catch (error) {
    console.error("Error deleting order:", error);
    return res.status(500).json({ message: "Failed to delete order", error });
  }
};
////////////////////////////////////////////////////////////////////////////////////////
export const updateOrderAddress = async (req: Request, res: Response) => {
  console.log("order_updateAddress");
  try {
    const userId = (req as any).user.id;
    const { orderId } = req.params;
    const isExistingOrder = await prisma.order.findUnique({
      where: {
        id: Number(orderId),
        userId,
      },
    });

    if (!isExistingOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    const { newAddressId } = req.body;
    const isExistingNewAddress = await prisma.addresses.findUnique({
      where: {
        id: Number(newAddressId),
        userId,
      },
    });

    if (!isExistingNewAddress) {
      return res.status(404).json({ message: "New address not found" });
    }

    // อัปเดตคำสั่งซื้อด้วย address ใหม่
    const updatedOrder = await prisma.order.update({
      where: {
        id: Number(orderId),
      },
      data: {
        addressesId: Number(newAddressId),
      },
    });

    // ตรวจสอบว่ามี slipUrl อยู่หรือไม่
    if (updatedOrder.slipUrl) {
      // หากมี slipUrl และ addressesId ให้เปลี่ยนสถานะเป็น awaiting_confirmation
      await prisma.order.update({
        where: { id: Number(orderId) },
        data: {
          status: "awaiting_confirmation",
        },
      });
    }

    return res.status(200).json({
      message: "Order address updated successfully.",
      updatedOrder,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to update order address",
      details: error,
    });
  }
};
//////////////////////////////////////////////////
