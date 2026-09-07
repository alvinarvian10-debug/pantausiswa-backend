import { PresensiService } from './presensi.service';

function mockPrisma() {
  return {
    siswa: { findUnique: jest.fn(), findMany: jest.fn() },
    sekretaris: { findUnique: jest.fn() },
    presensi: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };
}

describe('PresensiService', () => {
  let prisma: ReturnType<typeof mockPrisma>;
  let service: PresensiService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = mockPrisma();
    service = new PresensiService(prisma as any);
  });

  it('checkIn mencatat HADIR/TERLAMBAT untuk siswa aktif', async () => {
    prisma.siswa.findUnique.mockResolvedValue({ id: 1 });
    prisma.presensi.findUnique.mockResolvedValue(null);
    prisma.presensi.create.mockImplementation(async (args: any) => ({
      id: 10,
      ...args.data,
    }));
    const res = await service.checkIn(7);
    expect(['HADIR', 'TERLAMBAT']).toContain(res.status);
    expect(prisma.presensi.create).toHaveBeenCalledTimes(1);
  });

  it('checkIn ganda hari yang sama ditolak 400', async () => {
    prisma.siswa.findUnique.mockResolvedValue({ id: 1 });
    prisma.presensi.findUnique.mockResolvedValue({ id: 9 });
    await expect(service.checkIn(7)).rejects.toMatchObject({ status: 400 });
  });

  it('checkIn akun bukan siswa ditolak 403', async () => {
    prisma.siswa.findUnique.mockResolvedValue(null);
    await expect(service.checkIn(7)).rejects.toMatchObject({ status: 403 });
  });

  it('catat sekretaris untuk kelas sendiri lolos', async () => {
    prisma.sekretaris.findUnique.mockResolvedValue({ id: 1, kelasId: 2 });
    prisma.siswa.findUnique.mockResolvedValue({ id: 5, kelasId: 2 });
    prisma.presensi.findUnique.mockResolvedValue(null);
    prisma.presensi.create.mockImplementation(async (args: any) => args.data);
    const res = await service.catat(
      { userId: 9, role: 'SEKRETARIS' },
      { siswaId: 5, status: 'HADIR' },
    );
    expect(res.status).toBe('HADIR');
  });

  it('catat sekretaris lintas kelas ditolak 403', async () => {
    prisma.sekretaris.findUnique.mockResolvedValue({ id: 1, kelasId: 2 });
    prisma.siswa.findUnique.mockResolvedValue({ id: 6, kelasId: 3 });
    await expect(
      service.catat({ userId: 9, role: 'SEKRETARIS' }, { siswaId: 6, status: 'HADIR' }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('catat sekretaris non-aktif ditolak 403', async () => {
    prisma.sekretaris.findUnique.mockResolvedValue(null);
    await expect(
      service.catat({ userId: 9, role: 'SEKRETARIS' }, { siswaId: 5, status: 'HADIR' }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('catat guru/admin tanpa batas kelas', async () => {
    prisma.siswa.findUnique.mockResolvedValue({ id: 6, kelasId: 3 });
    prisma.presensi.findUnique.mockResolvedValue(null);
    prisma.presensi.create.mockImplementation(async (args: any) => args.data);
    const res = await service.catat(
      { userId: 2, role: 'GURU' },
      { siswaId: 6, status: 'SAKIT', catatan: 'sakit' },
    );
    expect(res.status).toBe('SAKIT');
    expect(prisma.sekretaris.findUnique).not.toHaveBeenCalled();
  });

  it('rekapSekretaris dibatasi ke kelas sendiri', async () => {
    prisma.sekretaris.findUnique.mockResolvedValue({ id: 1, kelasId: 2 });
    prisma.siswa.findMany.mockResolvedValue([]);
    const res = await service.rekapSekretaris(9);
    expect(res).toEqual([]);
    expect(prisma.siswa.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { kelasId: 2 } }),
    );
  });

  it('rekapSekretaris akun biasa ditolak 403', async () => {
    prisma.sekretaris.findUnique.mockResolvedValue(null);
    await expect(service.rekapSekretaris(9)).rejects.toMatchObject({
      status: 403,
    });
  });
});
