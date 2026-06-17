import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { authLimiter, createRateLimiter } from '../middleware/security';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../utils/validation';
import * as authService from '../services/auth.service';
import { getUserById } from '../services/user.service';
import logger from '../config/logger';

const router = Router();

router.post(
  '/register',
  authLimiter,
  validate({ body: registerSchema }),
  async (req: Request, res: Response) => {
    try {
      const { email, password, name } = req.body;
      const user = await authService.register(email, password, name);
      res.status(201).json({ message: 'Registration successful', user });
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      const statusCode = err.statusCode || 500;
      res.status(statusCode).json({ error: err.message });
    }
  }
);

router.post(
  '/login',
  authLimiter,
  validate({ body: loginSchema }),
  async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'];

      const result = await authService.login(email, password, ip, userAgent);

      res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000,
      });

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/auth',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json(result);
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      const statusCode = err.statusCode || 500;
      res.status(statusCode).json({ error: err.message });
    }
  }
);

router.post(
  '/refresh',
  authLimiter,
  async (req: Request, res: Response) => {
    try {
      const token = req.body.refreshToken || req.cookies?.refreshToken;
      if (!token) {
        res.status(400).json({ error: 'Refresh token is required' });
        return;
      }

      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'];

      const result = await authService.refreshToken(token, ip, userAgent);

      res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000,
      });

      res.json(result);
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      const statusCode = err.statusCode || 500;
      res.status(statusCode).json({ error: err.message });
    }
  }
);

router.post(
  '/logout',
  createRateLimiter(60 * 1000, 30, 'Too many logout requests'),
  async (req: Request, res: Response) => {
    try {
      const token = req.body.refreshToken || req.cookies?.refreshToken;
      if (token) {
        await authService.logout(token);
      }

      res.clearCookie('accessToken');
      res.clearCookie('refreshToken', { path: '/api/auth' });

      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      logger.error('Logout error', { error: (error as Error).message });
      res.json({ message: 'Logged out successfully' });
    }
  }
);

router.post(
  '/forgot-password',
  authLimiter,
  validate({ body: forgotPasswordSchema }),
  async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      await authService.forgotPassword(email, ip);
      res.json({ message: 'If the email exists, a password reset link has been sent' });
    } catch (error) {
      logger.error('Forgot password error', { error: (error as Error).message });
      res.json({ message: 'If the email exists, a password reset link has been sent' });
    }
  }
);

router.post(
  '/reset-password',
  authLimiter,
  validate({ body: resetPasswordSchema }),
  async (req: Request, res: Response) => {
    try {
      const { token, password } = req.body;
      await authService.resetPassword(token, password);
      res.json({ message: 'Password reset successful' });
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      const statusCode = err.statusCode || 500;
      res.status(statusCode).json({ error: err.message });
    }
  }
);

router.get(
  '/me',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const user = await getUserById(req.user!.userId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      res.json({ user });
    } catch (error) {
      logger.error('Get profile error', { error: (error as Error).message });
      res.status(500).json({ error: 'Failed to fetch user profile' });
    }
  }
);

const oauthLimiter = createRateLimiter(60 * 1000, 5, 'Too many OAuth attempts');

router.post(
  '/oauth/google',
  oauthLimiter,
  async (req: Request, res: Response) => {
    try {
      const { email, name, googleId } = req.body;
      if (!email || !googleId) {
        res.status(400).json({ error: 'Email and googleId are required' });
        return;
      }

      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'];

      const result = await authService.oauthLogin('google', googleId, email, name, ip, userAgent);
      res.json(result);
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      const statusCode = err.statusCode || 500;
      res.status(statusCode).json({ error: err.message });
    }
  }
);

router.post(
  '/oauth/apple',
  oauthLimiter,
  async (req: Request, res: Response) => {
    try {
      const { email, name, appleId } = req.body;
      if (!email || !appleId) {
        res.status(400).json({ error: 'Email and appleId are required' });
        return;
      }

      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'];

      const result = await authService.oauthLogin('apple', appleId, email, name, ip, userAgent);
      res.json(result);
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      const statusCode = err.statusCode || 500;
      res.status(statusCode).json({ error: err.message });
    }
  }
);

router.post(
  '/oauth/facebook',
  oauthLimiter,
  async (req: Request, res: Response) => {
    try {
      const { email, name, facebookId } = req.body;
      if (!email || !facebookId) {
        res.status(400).json({ error: 'Email and facebookId are required' });
        return;
      }

      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'];

      const result = await authService.oauthLogin('facebook', facebookId, email, name, ip, userAgent);
      res.json(result);
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      const statusCode = err.statusCode || 500;
      res.status(statusCode).json({ error: err.message });
    }
  }
);

export default router;
