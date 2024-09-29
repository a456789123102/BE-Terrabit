import { Request, Response } from 'express';
import { PrismaClient } from "@prisma/client";
import { CustomRequest } from "../../middlewares/verify"

const prisma = new PrismaClient();

//create
export const createReview = async (req: Request, res: Response) => {
    try {
        const { rating, comments } = req.body;
        const productId = parseInt(req.params.productId); 
        const user = (req as CustomRequest).user; 

        if (!rating || !comments) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const isAlreadyReview = await prisma.review.findFirst({
            where: {
                productId: productId,
                userId: user.id,
            }
        });

        if (isAlreadyReview) {
            return res.status(400).json({ message: 'You have already reviewed this product' });
        }

        // สร้างรีวิวใหม่ถ้าไม่เคยรีวิว
        const review = await prisma.review.create({
            data: {
                rating,
                comments,
                product: {
                    connect: {
                        id: productId,
                    }
                },
                user: {
                    connect: {
                        id: user.id,
                    }
                }
            }
        });

        return res.status(201).json(review);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error creating review', error });
    }
};

//edit reviews
export const updateReview = async ( req: Request, res:Response) => {
    try {
        const { rating, comments } = req.body;
        const productId = parseInt(req.params.productId); 
        const user = (req as CustomRequest).user; 

const existingReview = await prisma.review.findUnique({
    where: {
        productId_userId: { 
            productId: productId,
            userId: user.id,
        }
    }
});
if (!existingReview){
    return res.status(404).json({ message: 'Review not found' });
}

const updatedReview = await prisma.review.update({
    where: {
        productId_userId: { 
            productId: productId,
            userId: user.id,
        }
    },
    data: {
        rating,
        comments,
    }
});
return res.status(200).json({ message: 'Review updated successfully', category: updatedReview });

    } catch (error) {
        
    }
}