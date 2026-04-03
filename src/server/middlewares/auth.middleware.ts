import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-default-key-change-me';

export interface AuthRequest extends Request {
  userId?: string;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded: any = jwt.verify(token, JWT_SECRET);
      
      // Verification: Check if user still exists in the DB (important after resets)
      const user = await db.user.findUnique({ where: { id: decoded.id } });
      if (!user) {
        return res.status(401).json({ message: 'User no longer exists. Please log in again.' });
      }

      req.userId = decoded.id;
      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};
