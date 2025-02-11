import { Request, Response } from 'express';
import { PrismaClient } from "@prisma/client";
import { CustomRequest } from "../../middlewares/verify"

const prisma = new PrismaClient();

//create
export const createReview = async (req: Request, res: Response) => {
    console.log("Reviewcreate")
    try {
        const { rating, comments } = req.body;
        console.log("rating: " + rating + " comments: " + comments);
        const productId = parseInt(req.params.productId); 
        const user = (req as CustomRequest).user; 


        if (!rating || !comments) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        const isOver300Words = comments.length > 300;
        if (isOver300Words) {
            return res.status(400).json({ message: 'Comments must not exceed 300 words' });
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
        console.log("ReviewcreateD")
        return res.status(201).json(review);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error creating review', error });
    }
};

//edit reviews////////////////////////////////////////////////////////////////
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
        const page = Number(req.query.page) || 1;
        const pageSize = 5;

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
                updatedAt: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        const userFilteredReviews = reviews.map((e) => {
            const len = e.userName.length-1;
            const censoredUserName = e.userName
                .split("")
                .map((s, i) => (i === 0|| i === len  ? s : "*"))
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
                    updatedAt: true,
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

        const totalReviews = await prisma.review.aggregate({
            where: {
                productId: productId,
            },
            _count: {
                id: true,
            },
            _avg: {
                rating: true,
            },
        });
        const totalPages = Math.ceil(totalReviews._count.id / pageSize);

        if (!res.headersSent) {
            return res.status(200).json({
                reviews: userFilteredReviews,
                ratingScore: totalReviews._avg.rating,
                myReviews: myReviews,
                myReviewPermission: myReviewPermission,
                Pagination: {
                    page,
                    pageSize,
                    totalReviews,
                    totalPages,
                },
            });
        }
    } catch (error) {
        console.error("Error fetching reviews:", error);
        if (!res.headersSent) {
            return res.status(500).json({ error: "An error occurred while fetching reviews" });
        }
    }
};
