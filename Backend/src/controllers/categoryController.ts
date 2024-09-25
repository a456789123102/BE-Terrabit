import { Request, Response } from 'express';
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();
//create
export const createCategory = async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'Name is required' });
        }
        
        const category = await prisma.category.create({
            data: {
                name
            }
        })
        return res.status(200).json({massage: 'success',category});
    } catch (error) {
        console.error(error);
    return res.status(500).json({ message: 'Error while creating category', error });
    }
}

//update
export const updateCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; 
        const { name } = req.body; 

        if (!id || !name) {
            return res.status(400).json({ message: 'ID and name are required' });
        }

        // ตรวจสอบว่า category ที่ต้องการอัพเดทมีอยู่จริงหรือไม่
        const existingCategory = await prisma.category.findUnique({
            where: { id: Number(id) }
        });
        if (!existingCategory) {
            return res.status(404).json({ message: 'Category not found' });
        }
        // อัพเดท category
        const updatedCategory = await prisma.category.update({
            where: { id: Number(id) },
            data: { name }
        });

        return res.status(200).json({ message: 'Category updated successfully', category: updatedCategory });
    } catch (error) {
        console.error(error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // จัดการกับ Prisma error เฉพาะ
            if (error.code === 'P2002') {
                return res.status(400).json({ message: 'A category with this name already exists' });
            }
        }
        return res.status(500).json({ message: 'Error while updating category', error });
    }
}

//delete 
                   
export const deleteCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ message: 'ID is required' });
        }

        // ตรวจสอบว่า category ที่ต้องการลบมีอยู่จริงหรือไม่
        const existingCategory = await prisma.category.findUnique({
            where: { id: Number(id) }
        });
        if (!existingCategory) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // ลบ category
        await prisma.category.delete({
            where: { id: Number(id) }
        });

        return res.status(200).json({ message: `Category id:${id} deleted successfully` });
    }
    catch (error) {
        
    }
}