import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { uploadSlipToFirebase } from "../../utils/uploadSlipImage";

const prisma = new PrismaClient();

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