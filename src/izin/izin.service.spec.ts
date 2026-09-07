import { IzinService } from './izin.service';

function mockPrisma() {
  return {
    siswa: { findUnique: jest.fn() },
    guru: { findUnique: jest.fn() },
    pengajuanIzin: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    presensi: { upsert: jest.fn() },
    $transaction: jest.fn(),
  };
}

const JENIS = { jenis: 'IZIN', tanggalMulai: new Date('2026-09-10'), tanggalSelesai: new Date('2026-09-10') };

describe('IzinService', () => {
  let prisma: ReturnType<typeof mockPrisma>;
  let service: IzinService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = mockPrisma();
    service = new IzinService(prisma as any);
  });

  it('create menyimpan pengajuan siswa aktif', async () => {
    prisma.siswa.findUnique.mockResolvedValue({ id: 4 });
    prisma.pengajuanIzin.create.mockImplementation(async (args: any) => ({
      id: 1,
      ...args.data,
    }));
    const res = await service.create(8, {
      jenis: 'IZIN',
      tanggalMulai: '2026-09-10',
      tanggalSelesai: '2026-09-11',
      keterangan: 'acara keluarga',
    });
    expect(res.siswaId).toBe(4);
    expect(prisma.pengajuanIzin.create).toHaveBeenCalledTimes(1);
  });

  it('create tanggal selesai < mulai ditolak 400', async () => {
    prisma.siswa.findUnique.mockResolvedValue({ id: 4 });
    await expect(
      service.create(8, {
        jenis: 'IZIN',
        tanggalMulai: '2026-09-11',
        tanggalSelesai: '2026-09-10',
        keterangan: 'x',
      }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('create akun bukan siswa ditolak 403', async () => {
    prisma.siswa.findUnique.mockResolvedValue(null);
    await expect(
      service.create(8, {
        jenis: 'IZIN',
        tanggalMulai: '2026-09-10',
        tanggalSelesai: '2026-09-10',
        keterangan: 'x',
      }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('review APPROVE mengubah status + sinkron presensi', async () => {
    prisma.pengajuanIzin.findUnique.mockResolvedValue({
      id: 1,
      siswaId: 4,
      status: 'MENUNGGU',
      ...JENIS,
    });
    prisma.guru.findUnique.mockResolvedValue({ id: 2 });
    const tx = {
      pengajuanIzin: {
        update: jest.fn().mockImplementation(async (args: any) => ({
          id: 1,
          ...args.data,
        })),
      },
      presensi: { upsert: jest.fn().mockResolvedValue({}) },
    };
    prisma.$transaction.mockImplementation(async (cb: any) => cb(tx));
    const res = await service.review(1, 20, { status: 'DISETUJUI' as never });
    expect(res.status).toBe('DISETUJUI');
    expect(tx.pengajuanIzin.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1 } }),
    );
    expect(tx.presensi.upsert).toHaveBeenCalledTimes(1);
  });

  it('review pengajuan yang sudah diproses ditolak 400', async () => {
    prisma.pengajuanIzin.findUnique.mockResolvedValue({
      id: 1,
      status: 'DISETUJUI',
    });
    await expect(
      service.review(1, 20, { status: 'DITOLAK' as never }),
    ).rejects.toMatchObject({ status: 400 });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('review id tak ada ditolak 404', async () => {
    prisma.pengajuanIzin.findUnique.mockResolvedValue(null);
    await expect(
      service.review(999, 20, { status: 'DISETUJUI' as never }),
    ).rejects.toMatchObject({ status: 404 });
  });
});
