import { Request, Response } from 'express';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { initializeApp } from 'firebase/app';
import firebaseConfig from '../../config/firebase'; // ไฟล์ config ของ Firebase
import { PrismaClient } from '@prisma/client';
import multer from 'multer';

// ขยาย Request เพื่อรองรับการอัปโหลดไฟล์
interface CustomRequest extends Request {
    file?: Express.Multer.File;
}

// ตั้งค่า Firebase และ Prisma
initializeApp(firebaseConfig);
const storage = getStorage();
const prisma = new PrismaClient();

// เพิ่มการรองรับ multer
const upload = multer(); 

export const addImage = async (req: CustomRequest, res: Response) => {
  try {
    const { name, productId } = req.body;
    const file = req.file; // รับไฟล์จาก form-data

    // ตรวจสอบว่าค่า productId ถูกส่งมาเป็น string หรือ number
    const parsedProductId = parseInt(productId, 10);

    console.log('productId:', productId);  // พิมพ์ค่า productId เพื่อตรวจสอบ
    console.log('parsedProductId:', parsedProductId);  // ตรวจสอบว่าการแปลงสำเร็จหรือไม่

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // ตรวจสอบว่า parsedProductId เป็นตัวเลขที่ถูกต้องหรือไม่
    if (isNaN(parsedProductId)) {
      return res.status(400).json({ message: "Product ID is required and must be a valid number" });
    }

    const product = await prisma.product.findUnique({
      where: { id: parsedProductId },  
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const imageCount = await prisma.productImage.count({
      where: { productId: parsedProductId },
    });

    if (imageCount >= 5) {
      return res.status(400).json({ message: "This product already has 5 images, no more images can be added." });
    }

    // อัปโหลดไฟล์ไปยัง Firebase Storage
    const storageRef = ref(storage, `products/${file.originalname}`);
    const snapshot = await uploadBytes(storageRef, file.buffer);
    const downloadURL = await getDownloadURL(snapshot.ref);

    // บันทึกข้อมูลรูปภาพลงในฐานข้อมูล
    const image = await prisma.productImage.create({
      data: {
        name,
        imageUrl: downloadURL, // บันทึก URL ของรูปภาพ
        product: {
          connect: {
            id: product.id,
          }
        }
      }
    });

    return res.status(201).json(image);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error adding image', error });
  }
};

