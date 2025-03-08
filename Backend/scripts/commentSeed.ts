import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
    const existingProducts = await prisma.product.findMany({ select: { id: true } });
    const existingUsers = await prisma.user.findMany({ select: { id: true } });

    if (existingProducts.length === 0 || existingUsers.length === 0) {
        console.error("❌ Error: No products or users found in the database!");
        process.exit(1); 
    }

    for (let i = 0; i < 50; i++) {
        const createdAt = faker.date.between({ from: '2024-01-01T00:00:00.000Z', to: new Date().toISOString() });

        let productId: number = 0; 
        let userId: number = 0; 
        let isUnique = false;

       
        while (!isUnique) {
            const randomProduct = faker.helpers.arrayElement(existingProducts);
            const randomUser = faker.helpers.arrayElement(existingUsers);

          
            if (randomProduct?.id && randomUser?.id) {
                productId = randomProduct.id;
                userId = randomUser.id;
            }

            const existingReview = await prisma.review.findUnique({
                where: { productId_userId: { productId, userId } },
            });

            if (!existingReview) isUnique = true; 
        }

        await prisma.review.create({
            data: {
                productId, 
                userId,
                userName: faker.internet.displayName(),
                rating: faker.number.float({ min: 1, max: 5, fractionDigits: 1 }),
                comments: faker.word.words({ count: { min: 3, max: 30 } }),
                isPublished: true,
                createdAt,
                updatedAt: createdAt,
            },
        });
    }

    console.log("✅ Review seeding completed successfully!");
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
