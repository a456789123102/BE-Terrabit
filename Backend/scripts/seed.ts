import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

// โหลดข้อมูลจาก data.json
const rawData = fs.readFileSync('data.json', 'utf8');
const provinces: any[] = JSON.parse(rawData); 

async function seedDatabase() {
  console.log('🚀 เริ่มนำเข้าข้อมูล...');

  try {
    for (const province of provinces) {
      await prisma.province.create({
        data: {
          id: province.id,
          name_th: province.name_th,
          name_en: province.name_en,
          geography_id: province.geography_id,
          amphures: {
            create: province.amphure.map((amphure: any) => ({
              id: amphure.id,
              name_th: amphure.name_th,
              name_en: amphure.name_en,
              tambons: {
                create: amphure.tambon.map((tambon: any) => ({
                  id: tambon.id,
                  name_th: tambon.name_th,
                  name_en: tambon.name_en,
                  zip_code: tambon.zip_code
                })),
              },
            })),
          },
        },
      });
    }

    console.log('✅ นำเข้าข้อมูลสำเร็จ!');
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดระหว่างนำเข้า:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// รันฟังก์ชัน seed
seedDatabase();
//run seed by npx ts-node scripts/seed.ts
