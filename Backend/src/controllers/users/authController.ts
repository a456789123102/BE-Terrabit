import { Request, Response } from 'express';
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { CustomRequest } from '../../middlewares/verify';
import { PrismaClient} from "@prisma/client";
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const secretKey = process.env.JWT_SECRET_KEY;
//register
export const register = async (req: Request, res: Response) => {
  try {
    console.log("auth_register")
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
    console.log("auth_login")
    const {username ,password} = req.body
    if(!username || !password){
      return res.status(400).json({ message: 'Username and password are required' });
    }
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true, email: true, username: true, password: true}
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

//change password
export const changePassword = async (req: Request, res: Response) => {
  try {
    console.log("user_changePassword");

    const userId = (req as CustomRequest).user.id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Both old and new passwords are required." });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "incorrect old passwords." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.status(200).json({ message: "Password has been changed successfully." });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Error while changing password", error });
  }
};
//////

export const changeUsername = async (req: Request, res: Response) => {
  try {
    console.log("user_changeUsername");

    const userId = (req as CustomRequest).user.id;
    const { newUsername,oldPassword } = req.body;

    if (!newUsername) {
      return res.status(400).json({ message: "New username is required." });
    }

    if (!oldPassword) {
      return res.status(400).json({ message: "password is required." });
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }


    const isValidPassword = await bcrypt.compare(oldPassword,user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Incorrect passwords." });
    }

    const existingUser = await prisma.user.findUnique({
      where: { username: newUsername },
    });

    if (existingUser) {
      return res.status(409).json({ message: "Username is already taken. Please choose another." });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { username: newUsername },
    });

    res.status(200).json({ message: `Username has been changed to ${newUsername}.` });
  } catch (error) {
    console.error("Error changing username:", error);
    res.status(500).json({ message: "Error while changing username", error });
  }
};
