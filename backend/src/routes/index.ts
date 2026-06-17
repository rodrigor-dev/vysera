import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import adminRoutes from './admin.routes';
import uploadRoutes from './upload.routes';
import videoRoutes from './video.routes';
import exportRoutes from './export.routes';
import renderRoutes from './render.routes';
import paymentRoutes from './payment.routes';
import subscriptionRoutes from './subscription.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/admin', adminRoutes);
router.use('/upload', uploadRoutes);
router.use('/video', videoRoutes);
router.use('/exports', exportRoutes);
router.use('/render', renderRoutes);
router.use('/payments', paymentRoutes);
router.use('/subscriptions', subscriptionRoutes);

export default router;
