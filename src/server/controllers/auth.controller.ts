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
  const { email, password } = req.body;
  
  try {
    console.log(`[AUTH LOGIN]: Attempt started for email: ${email || 'undefined'}`);
    
    // 1. Initial Dependency Checks
    if (!process.env.DATABASE_URL) {
      console.error('[AUTH ERROR]: DATABASE_URL is missing in environment variables');
      return res.status(500).json({ 
        message: 'Database configuration error',
        error: 'DATABASE_URL_MISSING'
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error('[AUTH ERROR]: JWT_SECRET is missing in environment variables');
      return res.status(500).json({ 
        message: 'Auth configuration error',
        error: 'JWT_SECRET_MISSING'
      });
    }

    // 2. Input Validation
    if (!email || !password) {
      console.warn(`[AUTH LOGIN]: Missing credentials. email:${!!email}, password:${!!password}`);
      return res.status(400).json({ 
        message: 'Email and password are required',
        error: 'MISSING_CREDENTIALS'
      });
    }

    // 3. Database Lookup
    console.log(`[AUTH LOGIN]: Querying database for ${email}`);
    const user = await db.user.findUnique({ where: { email } });

    if (!user) {
      console.warn(`[AUTH LOGIN]: User not found: ${email}`);
      return res.status(404).json({ 
        message: 'No account found with this email address',
        error: 'USER_NOT_FOUND' 
      });
    }

    // 4. Password Verification
    console.log(`[AUTH LOGIN]: Verifying password for ${email}`);
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      console.warn(`[AUTH LOGIN]: Invalid password for ${email}`);
      return res.status(401).json({ 
        message: 'Invalid password. Please try again.',
        error: 'INVALID_PASSWORD' 
      });
    }

    // 5. Success
    console.log(`[AUTH LOGIN]: Success for ${email}. Generating token.`);
    const token = generateToken(user.id);
    
    return res.status(200).json({
      id: user.id,
      email: user.email,
      token,
      message: 'Login successful'
    });

  } catch (err: any) {
    console.error('[AUTH LOGIN CRITICAL ERROR]:', err);
    
    // Handle Prisma Specific Connection Errors
    if (err.code?.startsWith('P1')) {
      return res.status(500).json({
        message: 'Database connection failed. Please try again later.',
        error: err.code || 'PRISMA_ERROR',
        details: process.env.NODE_ENV !== 'production' ? err.message : undefined
      });
    }

    return res.status(500).json({ 
      message: 'An internal server error occurred during login',
      error: err.message || 'UNKNOWN_ERROR',
      stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
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
