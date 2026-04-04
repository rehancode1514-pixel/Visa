import express from 'express';
import multer from 'multer';
import { uploadPassport } from '../controllers/ocr.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

router.post('/upload-passport', protect as any, upload.single('passport'), uploadPassport);

export default router;
