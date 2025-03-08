import { PrismaClient, Order } from '@prisma/client';

const prisma = new PrismaClient();

const slipUrl = "https://firebasestorage.googleapis.com/v0/b/terrabit-5d129.appspot.com/o/slip%2FScreenshot-2567-07-03-at-13.21.01.png?alt=media&token=7b34e910-c84b-4097-87e3-bb60334ef851";

async function seedOrders() {
  console.log('🚀 Seeding orders...');

  try {
    const orders: Order[] = []; // กำหนดชนิดข้อมูลให้ชัดเจน

    for (let i = 12; i <= 30; i++) { // สร้าง Order ID 12 - 30
      const randomUserId = Math.floor(Math.random() * 8) + 1;
      const randomTotalPrice = parseFloat((Math.random() * 2000).toFixed(2));
      const randomAddressId = null; // อาจเป็น null

      orders.push({
        id: i,
        userId: randomUserId,
        totalPrice: randomTotalPrice,
        status: "payment_verified",
        slipUrl: slipUrl,
        createdAt: new Date(`2024-${Math.floor(Math.random() * 12) + 1}-${Math.floor(Math.random() * 28) + 1}`),
        updatedAt: new Date(),
        cancelOrRejectReason: null,
        addressesId: randomAddressId,
      } as Order); // ✅ ใช้ `as Order` เพื่อให้ TypeScript รับรู้ว่าเป็น Prisma Order
    }

    await prisma.order.createMany({ data: orders });

    console.log('✅ Orders seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding orders:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedOrders();
