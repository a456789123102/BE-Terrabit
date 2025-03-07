 import { Request, Response } from "express";
 import { PrismaClient } from "@prisma/client";
 import { uploadProductImageToFirebase } from "../../utils/uploadSlipImage";

 const prisma = new PrismaClient();


 export const uploadSlip = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { orderId } = req.params;
    const isExistingOrder = await prisma.order.findUnique({
      where: { id: Number(orderId), userId: userId },
    });

    if (!isExistingOrder)
      return res.status(404).json({ message: "Order not found." });

    const file = req.file;
    console.log("req.file:",file);

    if (!file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    if (!file.mimetype.startsWith("image/")) {
      return res.status(400).json({
        message: "Only image files are allowed.",
      });
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      return res.status(400).json({
        message: "File size exceeds the limit of 5MB.",
      });
    }

    const slipUrl: string = await uploadProductImageToFirebase(file);

    // อัปเดต slipUrl
    const updatedOrder = await prisma.order.update({
      where: { id: Number(orderId) },
      data: {
        slipUrl,
      },
    });
   
    if (updatedOrder.addressesId) {
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
      message: "Slip uploaded successfully.",
      updatedOrder,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to upload Slip Image",
      details: error,
    });
  }
};

export const deleteSlip = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { orderId } = req.params;
    const isExistingOrder = await prisma.order.findUnique({
      where: { id: Number(orderId), userId: userId },
    });

    if (!isExistingOrder)
      return res.status(404).json({ message: "Order not found." });

    const updatedOrder = await prisma.order.update({
      where: { id: Number(orderId) },
      data: {
        slipUrl: null,
        status: "pending_payment_proof",
      },
    });

    return res.status(200).json({
      message: "Slip deleted successfully.",
      updatedOrder,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to delete Slip Image",
      details: error,
    });
  }
}