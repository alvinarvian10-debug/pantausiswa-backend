import { BadRequestException } from '@nestjs/common';
import {
  assertValidImageUpload,
  canonicalExt,
  detectImageType,
} from './file-signature';

const jpeg = () =>
  Buffer.concat([
    Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
    Buffer.from('JFIF-payload'),
  ]);
const png = () =>
  Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.from('IHDR-payload'),
  ]);
const webp = () =>
  Buffer.concat([
    Buffer.from('RIFF'),
    Buffer.from([0x10, 0x00, 0x00, 0x00]),
    Buffer.from('WEBPVP8-payload'),
  ]);
const script = () => Buffer.from('<script>alert("xss")</script>');

describe('file-signature (magic byte validation)', () => {
  it('mendeteksi jpeg/png/webp asli dari header buffer', () => {
    expect(detectImageType(jpeg())).toBe('jpeg');
    expect(detectImageType(png())).toBe('png');
    expect(detectImageType(webp())).toBe('webp');
  });

  it('menolak script yang menyamar sebagai .jpg', () => {
    expect(() =>
      assertValidImageUpload({
        buffer: script(),
        mimetype: 'image/jpeg',
        originalname: 'foto.jpg',
        size: script().length,
      }),
    ).toThrow(BadRequestException);
    expect(() =>
      assertValidImageUpload({
        buffer: script(),
        mimetype: 'image/jpeg',
        originalname: 'foto.jpg',
        size: script().length,
      }),
    ).toThrow(/Invalid file signature detected/);
  });

  it('menolak mimetype yang tidak cocok dengan isi (png berisi klaim jpeg)', () => {
    expect(() =>
      assertValidImageUpload({
        buffer: png(),
        mimetype: 'image/jpeg',
        originalname: 'foto.jpg',
        size: 64,
      }),
    ).toThrow(/tidak cocok/);
  });

  it('menolak ekstensi yang tidak cocok (jpeg bernama .png) & jebakan .jpg.exe', () => {
    for (const name of ['foto.png', 'foto.jpg.exe', 'foto']) {
      expect(() =>
        assertValidImageUpload({
          buffer: jpeg(),
          mimetype: 'image/jpeg',
          originalname: name,
          size: 64,
        }),
      ).toThrow(BadRequestException);
    }
  });

  it('menolak buffer terpotong/kosong', () => {
    expect(detectImageType(Buffer.alloc(0))).toBeNull();
    expect(detectImageType(Buffer.from([0xff, 0xd8]))).toBeNull();
  });

  it('kombinasi valid lolos dan ekstensi kanonis benar', () => {
    expect(
      assertValidImageUpload({
        buffer: webp(),
        mimetype: 'image/webp',
        originalname: 'bukti.webp',
        size: 64,
      }),
    ).toBe('webp');
    expect(canonicalExt('jpeg')).toBe('.jpg');
    expect(canonicalExt('png')).toBe('.png');
  });
});
