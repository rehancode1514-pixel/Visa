import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-default-key-change-me';

const generateToken = (id: string) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });
};

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const userExists = await db.user.findUnique({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const user = await db.user.create({
      data: {
        email,
        password_hash,
      },
    });

    if (user) {
      res.status(201).json({
        id: user.id,
        email: user.email,
        token: generateToken(user.id),
      });
    } else {
      res.status(400).json({ message: 'Failed to create user record' });
    }
  } catch (error: any) {
    console.error('[AUTH REGISTER ERROR]:', error);
    res.status(500).json({ 
      message: 'Registration failed during database operation',
      error: error.message 
    });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    console.log(`[AUTH LOGIN]: Attempting login for ${email}`);
    const user = await db.user.findUnique({ where: { email } });

    if (user && (await bcrypt.compare(password, user.password_hash))) {
      console.log(`[AUTH LOGIN]: Login successful for ${email}`);
      res.json({
        id: user.id,
        email: user.email,
        token: generateToken(user.id),
      });
    } else {
      console.warn(`[AUTH LOGIN]: Invalid credentials for ${email}`);
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error: any) {
    console.error('[AUTH LOGIN ERROR]: Prisma Query Failed:', error);
    res.status(500).json({ 
      message: 'Login failed during database operation',
      error: error.message,
      code: error.code // Prisma error code (e.g., P2021 Table does not exist)
    });
  }
};


export const getMe = async (req: any, res: Response) => {
  try {
    const user = await db.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, created_at: true },
    });
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
