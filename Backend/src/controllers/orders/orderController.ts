import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

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
      return res.status(400).json({
        message:
          "Invalid status. Valid statuses areeee: pending, confirmed, cancelled.",
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
  console.log("order_updateStatusByAdmin");
  try {
    const { orderId } = req.params;
    const { status } = req.body;
console.log("updateStatus:",status)
    const validStatuses = [
      "awaiting_slip_upload",
      "awaiting_confirmation",
      "awaiting_rejection",
      "order_approved",
      "order_rejected",
      "order_cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. , you are sending status: ${status} Valid statusesare: ${validStatuses.join(
          ", "
        )}.`,
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
    console.log(`Updated order Id:${orderId} status: ${status} `);
    return res
      .status(200)
      .json({ message: "Order status updated successfully.", updatedOrder });
  } catch (error) {
    console.error("Order status update error:", error);
    return res.status(500).json({
      error: "Failed to update order status",
      details: error,
    });
  }
};
////////////////////////////////////////////////////////////////////////////////////////////
export const getAllOrders = async (req: Request, res: Response) => {
  console.log("order_getall");
  try {
    const { status } = req.query;
    const statuses = typeof status === "string" ? status.split(",") : [];
    const statusFilter =
      statuses.length > 0 ? { status: { in: statuses } } : {};

    const searchQuery = req.query.search as string | undefined;

    // Validate and default page and pageSize
    const page = Math.max(Number(req.query.page) || 1, 1); // Default to 1 and ensure >= 1
    const pageSize = Math.max(Number(req.query.pageSize) || 0, 0) || undefined; // Default to undefined if 0 or invalid
    const offset = pageSize ? (page - 1) * pageSize : undefined;

    // สร้าง searchFilter
    const searchFilter =
      typeof searchQuery === "string" && searchQuery.trim().length > 0
        ? {
            OR: [
              {
                id: isNaN(parseInt(searchQuery))
                  ? undefined
                  : parseInt(searchQuery),
              }, // ค้นหา orderId
              {
                userId: isNaN(parseInt(searchQuery))
                  ? undefined
                  : parseInt(searchQuery),
              }, // ค้นหา userId
              { items: { some: { productName: { contains: searchQuery } } } }, // ค้นหา productName ใน items
            ].filter(Boolean),
          }
        : {};

    // รวมเงื่อนไข statusFilter และ searchFilter
    const combinedFilter = {
      ...statusFilter,
      ...searchFilter,
    };

    // ดึงข้อมูลคำสั่งซื้อจากฐานข้อมูล
    const orders = await prisma.order.findMany({
      skip: offset,
      take: pageSize,
      where: combinedFilter,
      include: { items: true },
      orderBy: {
        createdAt: "desc", // ✅ เรียงออเดอร์ใหม่ -> เก่า
      },
    });

    // นับจำนวนคำสั่งซื้อทั้งหมด
    const totalOrders = await prisma.order.count({
      where: combinedFilter,
    });

    const totalPages = pageSize ? Math.ceil(totalOrders / pageSize) : 1;

    // ส่งข้อมูลคำสั่งซื้อกลับ
    return res.status(200).json({
      orders,
      pagination: {
        page,
        pageSize: pageSize || totalOrders, // ถ้า pageSize เป็น undefined แสดงจำนวนทั้งหมด
        totalOrders,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({ message: "Failed to fetch orders", error });
  }
};

//////////////////////////////////////////////////////////////////////////////////////////
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
      return res.status(400).json({
        message:
          "Invalid status. Valid statuses are: pending, confirmed, cancelled.",
      });
    }

    const orders = await prisma.order.findMany({
      where: {
        userId,
        status,
      },
      include: {
        items: true,
      },
      orderBy: {
        createdAt: "desc", // ✅ เรียงออเดอร์ใหม่ -> เก่า
      },
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
    return res
      .status(500)
      .json({ message: "Failed to get order by Id", error });
  }
};
///////////////////////////////////////////////////////////////////////////////////
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
