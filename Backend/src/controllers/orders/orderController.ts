import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import  { CustomRequest } from "../../middlewares/verify";

const prisma = new PrismaClient();

export const updateOrderStatusByUser = async (req: Request, res: Response) => {
  console.log("order_updateStatus");
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "pending_payment_proof",
      "pending_refound",
      "cancelled_by_user",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status.",
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

    const admins = await prisma.user.findMany({
      where: { isAdmin: true, isActive: true },
      select: { id: true },
    });

    const adminIds = admins.map((admin) => admin.id);

    await Promise.all(
      adminIds.map((adminId) =>
        prisma.notification.create({
          data: {
            userId: adminId,
            message: `New Order Request From users ID: #${String(
              orderId
            ).padStart(4, "0")}`,
            url: `/admin/manage/purchase`,
          },
        })
      )
    );

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
    const { status, reason } = req.body;
    console.log("updateStatus:", status);
    const validStatuses = [
      "pending_payment_proof",
      "pending_payment_verification",
      "pending_refound",
      "payment_verified",
      "cancelled_by_admin",
      "cancelled_by_user",
      "pending_refound",
      "refund_completed",
      "refund_rejected",
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
      data: { status, cancelOrRejectReason: reason },
    });
    console.log(`Updated order Id:${orderId} status: ${status} `);

    await prisma.notification.create({
      data: {
        userId: existingOrder.userId,
        message: `Your order ID: #${String(orderId).padStart(
          4,
          "0"
        )} Status has been updated`,
        url: `/user/purchase`,
      },
    });

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
    const page = Math.max(Number(req.query.page) || 1, 1);
    const pageSize = Math.max(Number(req.query.pageSize) || 0, 0) || undefined;
    const offset = pageSize ? (page - 1) * pageSize : undefined;
    const orderBy = (req.query.orderBy as "asc" | "desc") || "desc";
    const orderWith = (req.query.orderWith as string) || "createdAt";

    console.log("orderBy: " + orderBy, "orderWith: " + orderWith);
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
              { items: { some: { productName: { contains: searchQuery } } } },
            ].filter(Boolean),
          }
        : {};
    const combinedFilter = {
      ...statusFilter,
      ...searchFilter,
    };

    const orders = await prisma.order.findMany({
      skip: offset,
      take: pageSize,
      where: combinedFilter,
      include: { items: true },
      orderBy: {
        [orderWith]: orderBy,
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
        pageSize: pageSize || totalOrders,
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
    let statuses = req.query.status as string | string[];
    console.log(`Received status query: ${statuses}`);
    if (typeof statuses === "string") {
      statuses = [statuses];
    }
    const validStatuses = [
      "pending_payment_proof",
      "pending_payment_verification",
      "pending_refound",
      "payment_verified",
      "cancelled_by_admin",
      "cancelled_by_user",
      "refund_completed",
      "refund_rejected",
    ];

    if (!statuses.every((status) => validStatuses.includes(status))) {
      return res.status(400).json({
        message: `Invalid status. Valid statuses are: ${validStatuses.join(
          ", "
        )}`,
      });
    }
    const orders = await prisma.order.findMany({
      where: {
        userId,
        status: { in: statuses },
      },
      include: {
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const countByStatus = await prisma.order.groupBy({
      where: {
        userId,
      },
      by: ['status'], 
      _count: {
        _all: true, 
      },
    });

    const count =  countByStatus.map((s) => {
      return {
        status: s.status,
        count: s._count._all,
      };
    })
    

    return res.status(200).json({orders,count});
  } catch (error) {
    console.error("Error in getmyOrder:", error);
    return res.status(500).json({ message: "Failed to get orders", error });
  }
};

//////////////////////////////////////////////////////////////////////////////////////

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

    //มี slipUrl
    if (updatedOrder.slipUrl) {
      await prisma.order.update({
        where: { id: Number(orderId) },
        data: {
          status: "pending_payment_verification",
        },
      });
      const admins = await prisma.user.findMany({
        where: { isAdmin: true, isActive: true },
        select: { id: true },
      });
  
      const adminIds = admins.map((admin) => admin.id);
  
      await Promise.all(
        adminIds.map((adminId) =>
          prisma.notification.create({
            data: {
              userId: adminId,
              message: `New Order Request From users ID: #${String(
                orderId
              ).padStart(4, "0")}`,
              url: `/admin/manage/purchase`,
            },
          })
        )
      );
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
