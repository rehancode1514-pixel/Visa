import { Request, Response } from 'express';
import { db } from '../db.js';

export const getApplications = async (req: any, res: Response) => {
  try {
    const apps = await db.visaApplication.findMany({
      where: { user_id: req.userId },
      orderBy: { created_at: 'desc' }
    });
    res.json(apps);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createApplication = async (req: any, res: Response) => {
  try {
    const { country, visa_type } = req.body;
    const newApp = await db.visaApplication.create({
      data: {
        user_id: req.userId,
        country,
        visa_type,
        status: 'pending'
      }
    });
    res.status(201).json(newApp);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
