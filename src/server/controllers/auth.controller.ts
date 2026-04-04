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
    console.log('[AUTH DEBUG]: Headers:', req.headers);
    console.log(`[AUTH DEBUG]: Attempting login for ${email || 'undefined'}`);
    console.log('[AUTH DEBUG]: Body keys:', Object.keys(req.body || {}));

    // Validation
    if (!email || !password) {
      console.warn(`[AUTH LOGIN]: Missing credentials. email:${!!email}, password:${!!password}`);
      return res.status(400).json({ 
        error: 'Email and password are required',
        received: { email: !!email, password: !!password }
      });
    }

    const user = await db.user.findUnique({ where: { email } });

    // Handle user not found
    if (!user) {
      console.warn(`[AUTH LOGIN]: User not found: ${email}`);
      return res.status(404).json({ error: 'User not found' });
    }

    // Password comparison
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      console.warn(`[AUTH LOGIN]: Invalid password for ${email}`);
      return res.status(401).json({ error: 'Invalid password' });
    }

    // JWT Secret check
    if (!process.env.JWT_SECRET) {
      console.error('[AUTH ERROR]: JWT_SECRET is not defined');
      return res.status(500).json({ error: 'Internal server configuration error' });
    }

    console.log(`[AUTH LOGIN]: Login successful for ${email}`);
    res.json({
      id: user.id,
      email: user.email,
      token: generateToken(user.id),
    });
  } catch (err: any) {
    console.error('LOGIN ERROR:', err);
    return res.status(500).json({ error: err.message });
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
