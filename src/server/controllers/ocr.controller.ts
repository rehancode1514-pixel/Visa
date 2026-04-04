import { Request, Response } from 'express';

// For now, this mocks OCR until full execution implementation.
export const uploadPassport = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Call OCR service here realistically
    
    res.json({
      message: 'Passport uploaded successfully',
      filename: req.file.originalname,
      size: req.file.size
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
