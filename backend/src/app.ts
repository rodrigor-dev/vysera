import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';
import { config } from './config';
import logger from './config/logger';
import { generalLimiter, sanitizeInput, sqlInjectionPrevention } from './middleware/security';
import { globalErrorHandler, notFoundHandler } from './middleware/errorHandler';
import routes from './routes';

const app = express();

const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

const isProduction = process.env.NODE_ENV === 'production';

app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      mediaSrc: ["'self'", 'blob:', 'https:'],
      connectSrc: ["'self'", 'https://api.stripe.com', 'https://api.mercadopago.com'],
      frameSrc: ["'self'", 'https://js.stripe.com', 'https://www.mercadopago.com'],
      workerSrc: ["'self'", 'blob:'],
      objectSrc: ["'none'"],
      ...(isProduction ? { upgradeInsecureRequests: [] } : {}),
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: config.cors.origin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Total-Count'],
}));

app.use(cookieParser());
app.use(morgan('combined', { stream: morganStream }));

app.use((req: express.Request, _res: express.Response, next: express.NextFunction) => {
  if (req.path === '/api/payments/webhook' || req.path === '/api/payments/mp-webhook') {
    let raw = '';
    req.on('data', (chunk: Buffer) => { raw += chunk.toString('utf8'); });
    req.on('end', () => {
      (req as any).rawBody = raw;
      try { req.body = JSON.parse(raw); } catch { req.body = {}; }
      next();
    });
  } else {
    next();
  }
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(generalLimiter);
app.use(sanitizeInput);
app.use(sqlInjectionPrevention);

app.use('/uploads', express.static(path.join(__dirname, '../../uploads'), {
  maxAge: '1d',
  etag: true,
  lastModified: true,
  setHeaders: (res) => {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Content-Disposition', 'attachment');
  },
}));

app.use('/api', routes);

app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
