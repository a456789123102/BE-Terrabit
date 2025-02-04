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
                productId, // ใช้ productId ตรง ๆ ไม่ต้อง connect
                userId: user.id, // ใช้ userId ตรง ๆ
                userName: user.userName, // ✅ แก้ไขตรงนี้ให้เป็น string
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
        console.log(error);
        return res.status(500).json({ message: 'Error updating review', error });
    }
}

//get reviewsById

export const getReviewsById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const productId = parseInt(id);
        const reviews = await prisma.review.findMany({
            where: {
                productId: productId,
            },
            select: {
                id: true,
                userName:true,
                rating: true,
                comments: true,
                createdAt: true,
            },
        });
        const userFilteredReviews = reviews.map((e) => {
            const halfName = Math.ceil(e.userName.length / 2);
        
            // ✅ ใช้ .map() และตรวจเงื่อนไขให้ถูกต้อง
            const censoredUserName = e.userName.split('').map((s, i) => 
                i > halfName ? '*' : s
            ).join(''); //  แปลงกลับเป็น string
        
            return {
                ...e, //  เก็บค่าข้อมูลอื่น ๆ ของ review ไว้
                userName: censoredUserName //  เปลี่ยนชื่อผู้ใช้ที่เซ็นเซอร์แล้ว
            };
        });
        
        res.status(200).json(userFilteredReviews);
    } catch (error) {
        res.status(500).json({ error: "An error occurred while fetching reviews" });
    }
};
