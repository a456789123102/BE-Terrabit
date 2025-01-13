 import { Request, Response } from "express";
 import { PrismaClient } from "@prisma/client";
 import { uploadProductImageToFirebase } from "../../utils/uploadSlipImage";

 const prisma = new PrismaClient();

export const uploadSlip = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
      const {orderId} = req.params;
      const isExistingOrder = await prisma.order.findUnique({
        where: { id: Number(orderId),userId: userId},});
        if(!isExistingOrder) return res.status(404).json({message:"Order not found."});

        const isExistingImage = await prisma.slipImage.findUnique({
where:{
    orderId:Number(orderId)}
        });
        if(isExistingImage) return res.status(400).json({message:"Slip already uploaded."});
        const file = req.file;
        if (!file) {
          return res.status(400).json({ message: "No file uploaded." });
        }
        if (!file.mimetype.startsWith("image/")) {
          return res.status(400).json({ message: "Only image files are allowed." });
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          return res.status(400).json({ message: "File size exceeds the limit of 5MB." });
        }
        

        // อัปโหลดไฟล์ไปยัง Firebase
        const slipUrl: string = await uploadProductImageToFirebase(file);

  
   const createSliptImage = await prisma.slipImage.create({
        data:{
        imageUrl:slipUrl,
        orderId:Number(orderId)
        }
   });
    const updatedOrder = await prisma.order.update({
        where: { id: Number(orderId) },
        data: {
            status:"awaiting_confirmation"
        } });
      return res.status(200).json({ message: 'Slip uploaded successfully.', updatedOrder,createSliptImage });
    } catch (error) {
      return res.status(500).json({error:"Failed to upload Slip Image",details:error})
    }
  };

