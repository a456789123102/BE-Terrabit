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
                productId, 
                userId: user.id, 
                userName: user.userName, 
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

//get reviewsById ///////////////////////////////////////////////////////////////////////
export const getReviewsById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        console.log("Product ID:", id);

        // ✅ ปรับ type ของ user เพื่อให้แน่ใจว่าไม่เป็น 'never'
        const user = (req as CustomRequest).user ?? null;
        console.log("User:", user);

        if (!user) {
            console.log("User not found, maybe not logged in yet");
        }

        const productId = parseInt(id);
        if (isNaN(productId)) {
            if (!res.headersSent) {
                return res.status(400).json({ error: "Invalid product ID" });
            }
        }

        const reviews = await prisma.review.findMany({
            where: {
                productId: productId,
                ...(user ? { userId: { not: user.id } } : {}), // ✅ เช็คว่า user.id มีค่าก่อนใช้
            },
            select: {
                id: true,
                userName: true,
                rating: true,
                comments: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        const userFilteredReviews = reviews.map((e) => {
            const halfName = Math.ceil(e.userName.length / 2);
            const censoredUserName = e.userName
                .split("")
                .map((s, i) => (i > halfName ? "*" : s))
                .join("");
            return { ...e, userName: censoredUserName };
        });

        let myReviews = null;
        if (user) {
            myReviews = await prisma.review.findFirst({
                where: {
                    productId: productId,
                    userId: user.id,
                },
                select: {
                    id: true,
                    userName: true,
                    rating: true,
                    comments: true,
                    createdAt: true,
                },
            });
        }

        let myReviewPermission = false;
        if (user) {
            try {
                const checkMyReviewPermission = await prisma.orderItem.findFirst({
                    where: {
                        productId: productId,
                        order: {
                            userId: user.id,
                            status: "order_approved",
                        },
                    },
                });
                myReviewPermission = !!checkMyReviewPermission;
            } catch (err) {
                console.error("Error checking review permission:", err);
            }
        }

        // ✅ ป้องกันการเรียก res.json() ซ้ำ
        if (!res.headersSent) {
            return res.status(200).json({
                reviews: userFilteredReviews,
                myReviews: myReviews,
                myReviewPermission: myReviewPermission,
            });
        }
    } catch (error) {
        console.error("Error fetching reviews:", error);
        if (!res.headersSent) {
            return res.status(500).json({ error: "An error occurred while fetching reviews" });
        }
    }
};
