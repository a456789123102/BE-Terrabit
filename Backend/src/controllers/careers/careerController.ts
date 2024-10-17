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