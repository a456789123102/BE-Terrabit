import {Request, Response} from "express";
import { PrismaClient} from "@prisma/client";

const prisma = new PrismaClient();

export const createCareer = async (req: Request, res: Response) => {
    try {
        console.log("Career_create");
        const {  title, site, description, type, location,salary } = req.body;
        if (!title ||!site ||!description ||!type ||!location ||!salary) {
            return res.status(400).json({ message: "All fields are required" });
        }
     const career =   await prisma.career.create({
            data: {
                title,
                site,
                description,
                type,
                location,
                salary
            }
        });
        return res.status(200).json({ message: "Career created successfully", career });
    } catch (error) {
        return res.status(500).json({ message: "Error creating career", error });
    }
}

export const getAllCareers = async (req: Request, res: Response) => {
    try {
        console.log("Career_getAll");
        const careers = await prisma.career.findMany({
            select: {
                id: true,  
                title: true,  
                site: true, 
                type: true,  
                location: true,
                salary: true,
                createdAt: true, 
              },
            orderBy: { createdAt: "desc" },
            
        });
        res.status(200).json(careers);
    } catch (error) {
        return res.status(500).json({ message: "Error fetching careers", error });
        throw error;
    }
}

export const getCareerById = async (req:Request, res:Response) => {
    try {
        ("Career_getOneById")
        const { id } = req.params;
        const careerId = parseInt(id);
        const career = await prisma.career.findUnique({
            where: { id: careerId },
        });
        res.status(200).json(career);
        if (!career) {
            return res.status(404).json({ message: "Career not found" });
        }
    } catch (error) {
        console.error('error fetching career',error);
        throw error;
    }
}