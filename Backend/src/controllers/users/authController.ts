import { Request, Response } from 'express';
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { CustomRequest } from '../../middlewares/verify';
import { PrismaClient, Prisma } from "@prisma/client";
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const secretKey = process.env.JWT_SECRET_KEY;
//register
export const register = async (req: Request, res: Response) => {
  try {
    const { email, username, password, image } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ message: 'Email, username, and password are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      select: { id: true, email: true, username: true },
      data: {
        email,
        username,
        password: hashedPassword,
        image: image || "Not assign yet"
      }
    });

    return res.status(201).json({ message: 'User created successfully', user });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'An error occurred while creating the user' });
  }
};

// login
export const login = async (req:Request, res:Response) => {
  try {
    const {username ,password} = req.body
    if(!username || !password){
      return res.status(400).json({ message: 'Username and password are required' });
    }
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true, email: true, username: true, password: true, image: true }
    });
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid Username or Password' });
    }
    if (!secretKey) {
      return res.status(500).json({ error: "JWT secret Missing" });
    }
    const token = jwt.sign({ id: user.id }, secretKey, { expiresIn: '30d' });
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
}

//find all users

//find one user
