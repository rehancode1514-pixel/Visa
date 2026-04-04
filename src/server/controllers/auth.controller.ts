import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import { getJwtSecret } from '../utils/env.js';

const generateToken = (id: string) => {
  const secret = getJwtSecret();
  return jwt.sign({ id }, secret, { expiresIn: '30d' });
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
    console.log(`[LOGIN_DEBUG]: Login attempt started for: ${email || 'unknown'}`);
    
    // 1. Dependency/Environment Checks
    if (!process.env.DATABASE_URL) {
      console.error('[LOGIN_ERROR]: DATABASE_URL is missing in environment');
      return res.status(500).json({ 
        message: 'Server configuration error (DB_MISSING)',
        error: 'DATABASE_URL_NOT_SET'
      });
    }

    // 2. Input Validation
    if (!email || !password) {
      console.warn(`[LOGIN_DEBUG]: Missing credentials in request body`);
      return res.status(400).json({ 
        message: 'Email and password are required',
        error: 'MISSING_FIELDS'
      });
    }

    // 3. User Lookup
    console.log(`[LOGIN_DEBUG]: Looking up user: ${email}`);
    const user = await db.user.findUnique({ where: { email } });

    if (!user) {
      console.warn(`[LOGIN_DEBUG]: User not found: ${email}`);
      return res.status(404).json({ 
        message: 'Account not found',
        error: 'USER_NOT_FOUND' 
      });
    }

    // 4. Password Comparison
    console.log(`[LOGIN_DEBUG]: User found. Comparing passwords...`);
    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      console.warn(`[LOGIN_DEBUG]: Password mismatch for: ${email}`);
      return res.status(401).json({ 
        message: 'Invalid credentials',
        error: 'INVALID_PASSWORD' 
      });
    }

    // 5. Success
    console.log(`[LOGIN_DEBUG]: Success! Generating token for: ${email}`);
    const token = generateToken(user.id);
    
    return res.status(200).json({
      id: user.id,
      email: user.email,
      token,
      message: 'Login successful'
    });

  } catch (err: any) {
    console.error('[LOGIN_CRITICAL_ERROR]:', err);
    
    // Handle Prisma specific errors
    if (err.code?.startsWith('P')) {
      console.error(`[LOGIN_DATABASE_ERROR]: Prisma Code ${err.code}`);
      return res.status(500).json({
        message: 'Database connection issue. Please try again.',
        error: 'DATABASE_FAILURE',
        code: err.code
      });
    }

    return res.status(500).json({ 
      message: 'Internal server error during login',
      error: 'SERVER_ERROR',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
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
