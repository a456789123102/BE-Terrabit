import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createAddress = async (req: Request, res: Response) => {
  console.log("Address_create");
  try {
    const userId = Number((req as any).user.id);
    if (!userId) return res.status(400).json({ message: "User is required" });

    const {
      recipientName,
      currentAddress,
      provinceId,
      provinceName,
      amphureId,
      amphureName,
      tambonId,
      tambonName,
      zipCode,
      mobileNumber,
      email,
    } = req.body;

    if (!recipientName || !currentAddress || !provinceId || !amphureId || !tambonId || !zipCode || !mobileNumber) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const address = await prisma.addresses.create({
      data: {
        userId,
        recipientName,
        currentAddress,
        provinceId,
        provinceName,
        amphureId,
        amphureName,
        tambonId,
        tambonName,
        zipCode,
        mobileNumber,
        email,
      },
    });

    return res.status(200).json({ message: "Address created successfully", address });
  } catch (error) {
    console.error("❌ Error creating Address", error);
    return res.status(500).json({ message: "Error creating address", error });
  }
};

export const getOwnAddresses = async (req: Request, res: Response) => {
  try {
    const userId = Number((req as any).user.id);
    if (!userId) return res.status(400).json({ message: "User is required" });

    const addresses = await prisma.addresses.findMany({
      where: { userId: userId },
      select: {
        id: true,
        recipientName: true,
        currentAddress: true,
        provinceId: true,
        provinceName: true,
        amphureId: true,
        amphureName: true,
        tambonId: true,
        tambonName: true,
        zipCode: true,
        mobileNumber: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({ message: "Success", addresses });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching addresses", error });
  }
};

export const getOneAddress = async (req: Request, res: Response) => {
  try {
    const userId = Number((req as any).user.id);
    const addressId = Number(req.params.addressId);

    if (!userId) return res.status(400).json({ message: "User is required" });

    const address = await prisma.addresses.findUnique({
      where: { id: addressId, userId: userId },
      select: {
        id: true,
        recipientName: true,
        currentAddress: true,
        provinceId: true,
        provinceName: true,
        amphureId: true,
        amphureName: true,
        tambonId: true,
        tambonName: true,
        zipCode: true,
        mobileNumber: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    return res.status(200).json({ message: "Success", address });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching address", error });
  }
};

export const editAddress = async (req: Request, res: Response) => {
  console.log("Address_edit");
  try {
    const userId = Number((req as any).user.id);
    const addressId = Number(req.params.addressId);

    const {
      recipientName,
      currentAddress,
      provinceId,
      provinceName,
      amphureId,
      amphureName,
      tambonId,
      tambonName,
      zipCode,
      mobileNumber,
      email,
    } = req.body;

    if (!recipientName || !currentAddress || !provinceId || !amphureId || !tambonId || !zipCode || !mobileNumber) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const isExistingAddress = await prisma.addresses.findUnique({
      where: { id: addressId, userId: userId },
    });

    if (!isExistingAddress) {
      return res.status(404).json({ message: "Address not found" });
    }

    const address = await prisma.addresses.update({
      where: { id: addressId },
      data: {
        recipientName,
        currentAddress,
        provinceId,
        provinceName,
        amphureId,
        amphureName,
        tambonId,
        tambonName,
        zipCode,
        mobileNumber,
        email,
      },
    });

    return res.status(200).json({ message: "Address updated successfully", address });
  } catch (error) {
    return res.status(500).json({ message: "Error updating address", error });
  }
};

export const deleteAddress = async (req: Request, res: Response) => {
  try {
    const userId = Number((req as any).user.id);
    const addressId = Number(req.params.addressId);

    if (!userId) return res.status(400).json({ message: "User is required" });

    const isExistingAddress = await prisma.addresses.findUnique({
      where: { id: addressId, userId: userId },
    });

    if (!isExistingAddress) {
      return res.status(404).json({ message: "Address not found" });
    }

    await prisma.addresses.delete({
      where: { id: addressId },
    });

    return res.status(200).json({ message: "Address deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Error deleting address", error });
  }
};


export const getProvince = async(req: Request, res:Response) => {
  try {
    const data = await prisma.province.findMany({
      select: {
        id: true,
        name_th: true,
    }});
    res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({message: "Error while get province",error})
  }
}

export const getAmphure = async(req: Request, res:Response) => {
  try {
    const provinceId = Number(req.params.provinceId);
    const data = await prisma.amphure.findMany({
      where: {
        province_id: provinceId,
      },
      select: {
        id: true,
        name_th: true,
    }});
    res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({message: "Error while get amphure",error})
  }
}

export const getTambon = async(req: Request, res:Response) => {
  try {
    const amphureId = Number(req.params.amphureId);
    const data = await prisma.tambon.findMany({
      where: {
        amphure_id: amphureId,
      },
      select: {
        id: true,
        name_th: true,
        zip_code: true,
    }});
    res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({message: "Error while get tambon",error})
  }
}