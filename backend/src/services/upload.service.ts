import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config';
import logger from '../config/logger';

const ALLOWED_MIME_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-msvideo',
  'image/jpeg',
  'image/png',
  'image/webp',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/aac',
] as const;

const EXECUTABLE_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.msi', '.scr', '.pif',
  '.sh', '.bash', '.ps1', '.vbs', '.js', '.jar', '.wsf',
  '.app', '.gadget', '.msu', '.msp', '.scf', '.lnk', '.inf',
];

const MAGIC_BYTE_CHECKS: Record<string, { offset: number; bytes: number[] }[]> = {
  'video/mp4': [
    { offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] },
  ],
  'video/quicktime': [
    { offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] },
  ],
  'video/webm': [
    { offset: 0, bytes: [0x1A, 0x45, 0xDF, 0xA3] },
  ],
  'video/x-msvideo': [
    { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] },
    { offset: 8, bytes: [0x41, 0x56, 0x49, 0x20] },
  ],
  'image/jpeg': [
    { offset: 0, bytes: [0xFF, 0xD8, 0xFF] },
  ],
  'image/png': [
    { offset: 0, bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] },
  ],
  'image/webp': [
    { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] },
    { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] },
  ],
  'audio/mpeg': [
    { offset: 0, bytes: [0x49, 0x44, 0x33] },
    { offset: 0, bytes: [0xFF, 0xFB] },
  ],
  'audio/wav': [
    { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] },
    { offset: 8, bytes: [0x57, 0x41, 0x56, 0x45] },
  ],
  'audio/ogg': [
    { offset: 0, bytes: [0x4F, 0x67, 0x67, 0x53] },
  ],
  'audio/aac': [
    { offset: 0, bytes: [0xFF, 0xF1] },
    { offset: 0, bytes: [0xFF, 0xF9] },
  ],
};

export interface UploadResult {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  path: string;
}

export interface UploadPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface FileData {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
}

function getExtension(filename: string): string {
  const dotIndex = filename.lastIndexOf('.');
  if (dotIndex === -1) return '';
  return filename.slice(dotIndex).toLowerCase();
}

export function validateFile(mimeType: string, size: number): void {
  if (!ALLOWED_MIME_TYPES.includes(mimeType as typeof ALLOWED_MIME_TYPES[number])) {
    throw Object.assign(new Error(`File type ${mimeType} is not allowed`), { statusCode: 400 });
  }

  const maxSize = config.upload.maxFileSize;
  if (size > maxSize) {
    throw Object.assign(
      new Error(`File size ${size} exceeds maximum allowed size of ${maxSize} bytes`),
      { statusCode: 413 }
    );
  }

  if (size <= 0) {
    throw Object.assign(new Error('File is empty'), { statusCode: 400 });
  }
}

export function generateSecureFileName(originalName: string): string {
  const sanitized = originalName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^[._-]+/, '')
    .substring(0, 100);

  const ext = getExtension(sanitized);
  const baseName = sanitized.substring(0, sanitized.length - ext.length) || 'file';

  const uuid = uuidv4();
  return `${baseName}_${uuid}${ext}`;
}

function hasDoubleExtension(filename: string): boolean {
  const parts = filename.toLowerCase().split('.');
  const suspiciousExtensions = new Set(['.exe', '.bat', '.cmd', '.com', '.msi', '.scr', '.pif', '.sh', '.js', '.vbs', '.ps1']);

  for (let i = 1; i < parts.length - 1; i++) {
    const ext = '.' + parts[i];
    if (suspiciousExtensions.has(ext)) return true;
  }
  return false;
}

function isExecutableFile(filename: string): boolean {
  const ext = getExtension(filename);
  return EXECUTABLE_EXTENSIONS.includes(ext);
}

async function verifyMagicBytes(buffer: Buffer, mimeType: string): Promise<boolean> {
  const checks = MAGIC_BYTE_CHECKS[mimeType];
  if (!checks) return true;

  for (const check of checks) {
    const start = check.offset;
    const end = start + check.bytes.length;
    if (buffer.length < end) continue;

    const matches = check.bytes.every((byte, i) => buffer[start + i] === byte);
    if (matches) return true;
  }

  return false;
}

function getUploadDir(type: 'video' | 'audio' | 'image'): string {
  const baseDir = path.resolve(config.upload.dir);
  const subDir = type === 'video' ? 'videos' : type === 'audio' ? 'audio' : 'images';
  return path.join(baseDir, subDir);
}

function getUploadUrl(fileName: string, type: 'video' | 'audio' | 'image'): string {
  const subDir = type === 'video' ? 'videos' : type === 'audio' ? 'audio' : 'images';
  return `/uploads/${subDir}/${fileName}`;
}

export async function uploadFile(
  file: FileData,
  userId: string,
  type: 'video' | 'audio' | 'image',
  projectId?: string
): Promise<UploadResult> {
  validateFile(file.mimeType, file.size);

  if (hasDoubleExtension(file.originalName)) {
    throw Object.assign(new Error('Invalid file: double extension detected'), { statusCode: 400 });
  }

  if (isExecutableFile(file.originalName)) {
    throw Object.assign(new Error('Executable files are not allowed'), { statusCode: 400 });
  }

  const magicValid = await verifyMagicBytes(file.buffer, file.mimeType);
  if (!magicValid) {
    throw Object.assign(
      new Error(`File content does not match declared type ${file.mimeType}`),
      { statusCode: 400 }
    );
  }

  const fileName = generateSecureFileName(file.originalName);
  const uploadDir = getUploadDir(type);
  const filePath = path.join(uploadDir, fileName);
  const url = getUploadUrl(fileName, type);

  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(filePath, file.buffer);

  const upload = await prisma.upload.create({
    data: {
      userId,
      projectId: projectId || null,
      fileName,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      url,
      ...(type === 'video' ? { width: 0, height: 0, duration: 0 } : {}),
    },
  });

  logger.info('File uploaded', {
    uploadId: upload.id,
    userId,
    type,
    size: file.size,
    mimeType: file.mimeType,
  });

  return {
    id: upload.id,
    fileName: upload.fileName,
    originalName: upload.originalName,
    mimeType: upload.mimeType,
    size: upload.size,
    url: upload.url,
    path: filePath,
  };
}

export async function uploadFromBuffer(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  userId: string,
  type: 'video' | 'audio' | 'image',
  projectId?: string
): Promise<UploadResult> {
  return uploadFile(
    { buffer, originalName, mimeType, size: buffer.length },
    userId,
    type,
    projectId
  );
}

export async function deleteFile(fileId: string, userId: string): Promise<void> {
  const upload = await prisma.upload.findFirst({
    where: { id: fileId, userId },
  });

  if (!upload) {
    throw Object.assign(new Error('Upload not found'), { statusCode: 404 });
  }

  const filePath = path.resolve(config.upload.dir, upload.url.replace('/uploads/', ''));
  await fs.unlink(filePath).catch((err) => {
    logger.warn('Failed to delete file from disk', { path: filePath, error: (err as Error).message });
  });

  await prisma.upload.delete({ where: { id: fileId } });

  logger.info('File deleted', { uploadId: fileId, userId });
}

export async function getUploadUrlById(fileId: string): Promise<string | null> {
  const upload = await prisma.upload.findUnique({
    where: { id: fileId },
    select: { url: true },
  });
  return upload?.url || null;
}

export async function getUserUploads(
  userId: string,
  type?: 'video' | 'audio' | 'image',
  pagination?: { page?: number; limit?: number }
): Promise<{ data: UploadResult[]; pagination: UploadPagination }> {
  const page = pagination?.page || 1;
  const limit = pagination?.limit || 20;
  const skip = (page - 1) * limit;

  const mimeTypeMap: Record<string, string[]> = {
    video: ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'],
    audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac'],
    image: ['image/jpeg', 'image/png', 'image/webp'],
  };

  const where: Record<string, unknown> = { userId };
  if (type && mimeTypeMap[type]) {
    where.mimeType = { in: mimeTypeMap[type] };
  }

  const [uploads, total] = await Promise.all([
    prisma.upload.findMany({
      where: where as any,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.upload.count({ where: where as any }),
  ]);

  return {
    data: uploads.map((u) => ({
      id: u.id,
      fileName: u.fileName,
      originalName: u.originalName,
      mimeType: u.mimeType,
      size: u.size,
      url: u.url,
      path: path.resolve(config.upload.dir, u.url.replace('/uploads/', '')),
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getUploadById(uploadId: string, userId: string): Promise<UploadResult | null> {
  const upload = await prisma.upload.findFirst({
    where: { id: uploadId, userId },
  });
  if (!upload) return null;

  return {
    id: upload.id,
    fileName: upload.fileName,
    originalName: upload.originalName,
    mimeType: upload.mimeType,
    size: upload.size,
    url: upload.url,
    path: path.resolve(config.upload.dir, upload.url.replace('/uploads/', '')),
  };
}
