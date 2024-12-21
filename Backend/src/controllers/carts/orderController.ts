import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { uploadSlipToFirebase } from "../../utils/uploadSlipImage";

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

export const uploadSlip = async (req: Request, res: Response) => {
  try {
    const {orderId} = req.params;
    if(!req.file){
      return res.status(400).json({message: 'No file uploaded'});
    }
    const slipUrl = await uploadSlipToFirebase(req.file);

    const updatedOrder = await prisma.order.update({
      where: { id: Number(orderId) },
      data: { slipUrl }
    });
    return res.status(200).json({ message: 'Slip uploaded successfully.', updatedOrder });
  } catch (error) {
    return res.status(500).json({error:"Failed to upload Slip Image",details:error})
  }
};