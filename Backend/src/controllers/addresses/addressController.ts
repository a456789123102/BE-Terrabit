import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createAddress = async (req: Request, res: Response) => {
  console.log("Address_create");
  try {
    const userId = Number((req as any).user.id);
    if (!userId) return res.status(400).json({ message: "User is required" });
    const { recipientName, street, city, state, zipCode } = req.body;
    if (!recipientName || !street || !city || !state || !zipCode) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const isExistingAddress = await prisma.addresses.findUnique({
      where: { userId: userId },
    });
    if (isExistingAddress) {
      return res.status(409).json({ message: "Address already exists" });
    }
    const address = await prisma.addresses.create({
      data: {
        userId,
        recipientName,
        street,
        city,
        state,
        zipCode,
      },
    });
    return res
      .status(200)
      .json({ message: "Address created successfully", address });
  } catch (error) {
    console.error("error creating Address", error);
    return res.status(500).json({ message: "Error creating address", error });
  }
};

export const getOwnAddresses = async (req: Request, res: Response) => {
    try {
        const userId = Number((req as any).user.id);
        if (!userId) return res.status(400).json({ message: "User is required" });
        const address = await prisma.addresses.findUnique({
            where: { userId: userId },
        });
        return res.status(200).json({message:"success",address});
    } catch (error) {
        return res.status(500).json({ message:"error creating address", error });
    }
}

export const editAddress = async (req: Request, res: Response) => {
  console.log("Address_edit");
  try {
    const userId = Number((req as any).user.id);
    const { recipientName, street, city, state, zipCode } = req.body;
    if (!recipientName || !street || !city || !state || !zipCode) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const isExistingAddress = await prisma.addresses.findUnique({
      where: {
        userId: userId,
      },
    });
    if (!isExistingAddress) {
      return res.status(404).json({ message: "Address not found" });
    }
    const address = await prisma.addresses.update({
      where: {
        userId: userId,
      },
      data: {
        recipientName,
        street,
        city,
        state,
        zipCode,
      },
    });
    return res.status(200).json({
      message: "address updated successfully",
      address,
    });
  } catch (error) {
    return res.status(500).json({ message:"Error updating address", error});
  }
};

export const deleteAddress = async (req: Request, res: Response) => {
    console.log("Address_delete");
  try {
    const userId = Number((req as any).user.id);
    if(!userId) return res.status(404).json({message:"user not found"});
    await prisma.addresses.delete({
        where: {
          userId: userId,
        },
    });
    return res.status(200).json({ message: "Address deleted successfully" });
  } catch (error) {
    return res.status(500).json({message: "Error while delete address",error})
  }
}
