import { BadRequestException } from '@nestjs/common';
import { extname } from 'path';

/**
 * Validasi magic bytes — chống spoofing file upload.
 *
 * Client bisa berbohong soal `mimetype` dan ekstensi (mis. script
 * berbahaya dinamai `foto.jpg` dengan header `image/jpeg`). Satu-satunya
 * kebenaran adalah N-byte pertama dari buffer itu sendiri:
 *   JPEG → FF D8 FF
 *   PNG  → 89 50 4E 47 0D 0A 1A 0A
 *   WEBP → "RIFF"...."WEBP" (byte 0-3 & 8-11)
 *
 * Dipanggil SETELAH multer menerima file (memoryStorage) dan SEBELUM
 * file ditulis ke disk — file palsu tidak pernah menyentuh filesystem.
 */
export type DetectedImage = 'jpeg' | 'png' | 'webp';

export function detectImageType(buf: Buffer): DetectedImage | null {
  if (!buf || buf.length < 3) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg';
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return 'png';
  }
  if (
    buf.length >= 12 &&
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'webp';
  }
  return null;
}

const MIME_FOR: Record<DetectedImage, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

const EXT_FOR: Record<DetectedImage, string[]> = {
  jpeg: ['.jpg', '.jpeg'],
  png: ['.png'],
  webp: ['.webp'],
};

/** Ekstensi kanonis per tipe terdeteksi (mencegah `.jpg.exe`). */
export function canonicalExt(detected: DetectedImage): string {
  return detected === 'jpeg' ? '.jpg' : `.${detected}`;
}

export interface UploadedImageFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

/**
 * Tiga lapis pengecekan silang; semuanya harus konsisten:
 *  1. magic bytes terdeteksi (bukan script/buffer acak),
 *  2. mimetype klaim klien == tipe terdeteksi,
 *  3. ekstensi nama file == tipe terdeteksi.
 * @throws BadRequestException('Invalid file signature detected') bila gagal.
 */
export function assertValidImageUpload(file: UploadedImageFile): DetectedImage {
  const detected = detectImageType(file.buffer);
  if (!detected) {
    throw new BadRequestException(
      'Invalid file signature detected: isi file bukan gambar jpeg/png/webp yang valid',
    );
  }
  if (file.mimetype !== MIME_FOR[detected]) {
    throw new BadRequestException(
      `Invalid file signature detected: mimetype "${file.mimetype}" tidak cocok dengan isi file (${detected})`,
    );
  }
  const ext = extname(file.originalname).toLowerCase();
  if (!EXT_FOR[detected].includes(ext)) {
    throw new BadRequestException(
      `Invalid file signature detected: ekstensi "${ext || '(tanpa ekstensi)'}" tidak cocok dengan isi file (${detected})`,
    );
  }
  return detected;
}
