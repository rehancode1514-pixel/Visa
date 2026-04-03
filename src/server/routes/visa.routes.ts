import express from 'express';
import { getApplications, createApplication } from '../controllers/visa.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect as any);
router.route('/').get(getApplications).post(createApplication);

export default router;
