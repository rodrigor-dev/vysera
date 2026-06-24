import { Router, Request, Response, NextFunction } from 'express';
import Busboy from 'busboy';
import { authenticate } from '../middleware/auth';
import { createRateLimiter } from '../middleware/security';
import { requireUploadLimit } from '../middleware/plan-guard';
import * as uploadService from '../services/upload.service';
import logger from '../config/logger';

const router = Router();

const uploadLimiter = createRateLimiter(60 * 1000, 10, 'Too many upload requests');

router.use(authenticate);

function parseUpload(
  req: Request,
  res: Response,
  type: 'video' | 'audio' | 'image'
): void {
  const projectId = req.query.projectId as string | undefined;

  const busboy = Busboy({
    headers: req.headers,
    limits: {
      fileSize: 500 * 1024 * 1024,
      files: 1,
    },
  });

  let fileFound = false;
  let fileBuffer: Buffer | null = null;
  let fileName = '';
  let fileMime = '';
  let fileSize = 0;

  busboy.on('file', (fieldname, file, info) => {
    if (fileFound) {
      file.resume();
      return;
    }
    fileFound = true;
    fileName = info.filename;
    fileMime = info.mimeType;

    const chunks: Buffer[] = [];
    file.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
      fileSize += chunk.length;

      if (fileSize > 500 * 1024 * 1024) {
        file.resume();
        res.status(413).json({ error: 'File too large' });
        return;
      }
    });

    file.on('end', () => {
      fileBuffer = Buffer.concat(chunks);
    });

    file.on('limit', () => {
      res.status(413).json({ error: 'File too large' });
    });
  });

  busboy.on('finish', async () => {
    if (!fileFound || !fileBuffer) {
      res.status(400).json({ error: 'No file provided' });
      return;
    }

    try {
      const result = await uploadService.uploadFile(
        {
          buffer: fileBuffer,
          originalName: fileName,
          mimeType: fileMime,
          size: fileSize,
        },
        req.user!.userId,
        type,
        projectId
      );

      res.status(201).json({ message: 'Upload successful', upload: result });
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      logger.error('Upload failed', {
        error: err.message,
        userId: req.user!.userId,
        type,
        fileName,
      });
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  });

  busboy.on('error', (error: Error) => {
    logger.error('Busboy parsing error', { error: error.message });
    res.status(400).json({ error: 'Failed to parse upload' });
  });

  req.pipe(busboy);
}

function contentTypeFilter(allowedPrefixes: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentType = req.headers['content-type'] || '';
    const matches = allowedPrefixes.some((prefix) => contentType.startsWith(prefix));
    if (!matches) {
      res.status(415).json({ error: `Unsupported content-type. Expected one of: ${allowedPrefixes.join(', ')}` });
      return;
    }
    next();
  };
}

router.post('/video', contentTypeFilter(['multipart/form-data']), uploadLimiter, requireUploadLimit, (req: Request, res: Response) => {
  parseUpload(req, res, 'video');
});

router.post('/audio', contentTypeFilter(['multipart/form-data']), uploadLimiter, requireUploadLimit, (req: Request, res: Response) => {
  parseUpload(req, res, 'audio');
});

router.post('/image', contentTypeFilter(['multipart/form-data']), uploadLimiter, requireUploadLimit, (req: Request, res: Response) => {
  parseUpload(req, res, 'image');
});

router.get('/list', async (req: Request, res: Response) => {
  try {
    const type = req.query.type as 'video' | 'audio' | 'image' | undefined;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;

    const result = await uploadService.getUserUploads(req.user!.userId, type, {
      page,
      limit,
    });

    res.json(result);
  } catch (error) {
    logger.error('List uploads error', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to list uploads' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await uploadService.deleteFile(req.params.id!, req.user!.userId);
    res.json({ message: 'Upload deleted successfully' });
  } catch (error) {
    const err = error as Error & { statusCode?: number };
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const upload = await uploadService.getUploadById(req.params.id!, req.user!.userId);
    if (!upload) {
      res.status(404).json({ error: 'Upload not found' });
      return;
    }
    res.json({ upload });
  } catch (error) {
    logger.error('Get upload error', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to get upload' });
  }
});

export default router;
