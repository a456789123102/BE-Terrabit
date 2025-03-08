import { PrismaClient, User } from '@prisma/client'; // Import Prisma Type
import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    // กำหนด Type ให้ชัดเจนว่าเป็น User[]
    const users: Omit<User, 'id'>[] = []; // ไม่ต้องกำหนด 'id' เพราะฐานข้อมูลสร้างให้อัตโนมัติ

    for (let i = 0; i < 50; i++) {
        const email = faker.internet.email();
        const username =  faker.internet.username()
        const password = await bcrypt.hash('password123', 10); // Hash รหัสผ่าน
        const isActive = true;
        const isAdmin = false;
        const createdAt = faker.date.between({ from: '2024-01-01T00:00:00.000Z', to: new Date().toISOString() });

        users.push({
            email,
            username,
            password,
            isActive,
            isAdmin,
            createdAt,
            updatedAt: createdAt,
        });
    }

    await prisma.user.createMany({
        data: users,
    });

    console.log("✅ User seeding completed successfully!");
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
