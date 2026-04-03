import { Request, Response } from 'express';
import { db } from '../db.js';

export const getProfile = async (req: any, res: Response) => {
  try {
    const profile = await db.profile.findUnique({
      where: { user_id: req.userId }
    });
    res.json(profile || {});
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const upsertProfile = async (req: any, res: Response) => {
  try {
    const { fullName, passportNumber, nationality, dob, expiryDate, profilePhoto, passportPhoto } = req.body;
    
    const profileData = {
        full_name: fullName || req.body.full_name,
        passport_number: passportNumber || req.body.passport_number,
        nationality: nationality,
        dob: dob,
        expiry_date: expiryDate || req.body.expiry_date || "",
        profile_photo: profilePhoto || req.body.profile_photo,
        passport_photo: passportPhoto || req.body.passport_photo
    };

    const profile = await db.profile.upsert({
      where: { user_id: req.userId },
      update: profileData,
      create: {
        user_id: req.userId,
        ...profileData
      }
    });
    
    res.json({ success: true, profile });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
