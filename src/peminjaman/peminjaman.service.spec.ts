import { BadRequestException } from '@nestjs/common';
import { PeminjamanService } from './peminjaman.service';

/**
 * BUKTI ATOMISITAS (anti race-condition / overselling).
 *
 * Kode produksi yang diuji — review() di peminjaman.service.ts:
 *   1. this.prisma.$transaction(async (tx) => {...})
 *   2. tx.peminjaman.updateMany({ where: { id, status: 'MENUNGGU' } })
 *      → guard idempotensi di level DB (bukan if di JS).
 *   3. tx.barang.updateMany({ where: { id, jumlahTersedia: { gte: jumlah } },
 *      data: { jumlahTersedia: { decrement } } })
 *      → guard stok di level DB, decrement atomik.
 *
 * Skenario: stok = 1, dua admin klik APPROVE bersamaan untuk id yang sama.
 * Hasil yang benar: 1 sukses (DIPINJAM, stok 1→0), 1 gagal
 * BadRequestException('Peminjaman sudah direview...'). Stok TIDAK PERNAH minus.
 */
describe('PeminjamanService.review — atomicity vs race condition', () => {
  function buildServiceWithSharedState() {
    // State bersama antar transaksi — mensimulasikan SATU baris DB.
    const db = {
      peminjaman: {
        id: 1,
        barangId: 10,
        siswaId: 5,
        jumlah: 1,
        status: 'MENUNGGU',
      },
      barang: { id: 10, jumlahTersedia: 1 },
    };

    // Tiru semantik Prisma updateMany: kembalikan { count } berdasarkan
    // kecocokan WHERE di level "DB", bukan pengecekan JS di service.
    const tx = {
      peminjaman: {
        findUnique: jest.fn(async ({ where }: any) =>
          where.id === db.peminjaman.id ? { ...db.peminjaman } : null,
        ),
        updateMany: jest.fn(async ({ where, data }: any) => {
          // Guard 1: hanya baris MENUNGGU yang boleh berubah.
          // Simulasi jeda I/O agar interleaving Promise.all terasa.
          await new Promise((r) => setTimeout(r, 5));
          if (where.id !== db.peminjaman.id) return { count: 0 };
          if (
            where.status !== undefined &&
            db.peminjaman.status !== where.status
          ) {
            // where.status==='MENUNGGU' tapi DB sudah 'DIPINJAM' → count 0.
            return { count: 0 };
          }
          db.peminjaman.status = data.status;
          return { count: 1 };
        }),
        findUniqueOrThrow: jest.fn(async ({ where }: any) => {
          if (where.id !== db.peminjaman.id)
            throw new Error('not found');
          return {
            ...db.peminjaman,
            barang: { ...db.barang },
          };
        }),
      },
      barang: {
        updateMany: jest.fn(async ({ where, data }: any) => {
          await new Promise((r) => setTimeout(r, 5));
          // Guard 2: stok cukup di level DB (gte) + decrement atomik.
          if (where.id !== db.barang.id) return { count: 0 };
          const need = where.jumlahTersedia?.gte ?? 0;
          if (db.barang.jumlahTersedia < need) return { count: 0 };
          db.barang.jumlahTersedia -= data.jumlahTersedia.decrement;
          return { count: 1 };
        }),
      },
    };

    const prisma: any = {
      // $transaction meneruskan SATU tx yang berbagi `db` — seperti
      // dua koneksi DB konkuren yang berebut baris yang sama.
      $transaction: jest.fn((cb: any) => cb(tx)),
    };
    const service = new PeminjamanService(prisma);
    return { service, db, prisma, tx };
  }

  it('dua APPROVE konkuren untuk stok=1 → 1 sukses, 1 BadRequest, stok tepat 0', async () => {
    const { service, db } = buildServiceWithSharedState();

    // Simulasi dua klik APPROVE bersamaan (dua request HTTP paralel).
    const results = await Promise.allSettled([
      service.review(1, { aksi: 'APPROVE' }),
      service.review(1, { aksi: 'APPROVE' }),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const reason = (rejected[0] as PromiseRejectedResult).reason;
    expect(reason).toBeInstanceOf(BadRequestException);

    // Stok hanya berkurang SEKALI — tidak oversell, tidak minus.
    expect(db.barang.jumlahTersedia).toBe(0);
    expect(db.peminjaman.status).toBe('DIPINJAM');
  });

  it('APPROVE kedua setelah stok habis ditolak dengan pesan stok', async () => {
    const { service, db } = buildServiceWithSharedState();

    await service.review(1, { aksi: 'APPROVE' });
    expect(db.barang.jumlahTersedia).toBe(0);

    // Upaya APPROVE ulang (id sama, sudah DIPINJAM) → guard status menolak.
    await expect(
      service.review(1, { aksi: 'APPROVE' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(db.barang.jumlahTersedia).toBe(0);
  });
});
