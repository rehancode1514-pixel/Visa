import express from 'express';
import { getProfile, upsertProfile } from '../controllers/profile.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect as any);
router.route('/').get(getProfile).post(upsertProfile);

export default router;
