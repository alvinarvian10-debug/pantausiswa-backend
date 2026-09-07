import { AduanService } from './aduan.service';
import { PeminjamanService } from '../peminjaman/peminjaman.service';

function mockAduanPrisma() {
  return {
    aduan: {
      create: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };
}

describe('AduanService anonimitas', () => {
  it('findAll menyamarkan pelapor aduan anonim', async () => {
    const prisma = mockAduanPrisma();
    prisma.$transaction.mockResolvedValue([
      2,
      [
        { id: 1, isAnonim: true, pelapor: { nama: 'Fauzi', role: 'SISWA' } },
        { id: 2, isAnonim: false, pelapor: { nama: 'Rina', role: 'SISWA' } },
      ],
    ]);
    const service = new AduanService(prisma as any);
    const res = await service.findAll({});
    expect(res.data[0].pelapor).toBeNull();
    expect(res.data[1].pelapor).toMatchObject({ nama: 'Rina' });
  });

  it('create menyimpan flag isAnonim', async () => {
    const prisma = mockAduanPrisma();
    prisma.aduan.create.mockImplementation(async (args: any) => ({
      id: 7,
      ...args.data,
    }));
    const service = new AduanService(prisma as any);
    const res = await service.create(3, {
      judul: 'AC mati',
      deskripsi: 'panas',
      kategori: 'FASILITAS',
    } as any);
    expect(res.isAnonim).toBe(false);
    const res2 = await service.create(3, {
      judul: 'x',
      deskripsi: 'y',
      kategori: 'FASILITAS',
      isAnonim: true,
    } as any);
    expect(res2.isAnonim).toBe(true);
  });
});

function mockPinjamPrisma() {
  return {
    siswa: { findUnique: jest.fn() },
    barang: { findUnique: jest.fn() },
    peminjaman: {
      create: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };
}

describe('PeminjamanService returnMandiri', () => {
  let prisma: ReturnType<typeof mockPinjamPrisma>;
  let service: PeminjamanService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = mockPinjamPrisma();
    service = new PeminjamanService(prisma as any);
  });

  function mockTx() {
    const tx = {
      peminjaman: { update: jest.fn().mockImplementation(async (a: any) => ({ id: 1, ...a.data })) },
      barang: { update: jest.fn().mockResolvedValue({}) },
    };
    prisma.$transaction.mockImplementation(async (cb: any) => cb(tx));
    return tx;
  }

  it('siswa mengembalikan miliknya yang DIPINJAM + stok pulih', async () => {
    prisma.siswa.findUnique.mockResolvedValue({ id: 4 });
    prisma.peminjaman.findUnique.mockResolvedValue({
      id: 1,
      siswaId: 4,
      barangId: 2,
      jumlah: 1,
      status: 'DIPINJAM',
    });
    const tx = mockTx();
    const res = await service.returnMandiri(1, 8);
    expect(res.status).toBe('DIKEMBALIKAN');
    expect(tx.barang.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 2 } }),
    );
  });

  it('pinjaman milik orang lain ditolak 404', async () => {
    prisma.siswa.findUnique.mockResolvedValue({ id: 4 });
    prisma.peminjaman.findUnique.mockResolvedValue({ id: 1, siswaId: 99, status: 'DIPINJAM' });
    await expect(service.returnMandiri(1, 8)).rejects.toMatchObject({ status: 404 });
  });

  it('belum disetujui ditolak 400', async () => {
    prisma.siswa.findUnique.mockResolvedValue({ id: 4 });
    prisma.peminjaman.findUnique.mockResolvedValue({ id: 1, siswaId: 4, status: 'MENUNGGU' });
    await expect(service.returnMandiri(1, 8)).rejects.toMatchObject({ status: 400 });
  });

  it('bukan siswa ditolak 403', async () => {
    prisma.siswa.findUnique.mockResolvedValue(null);
    await expect(service.returnMandiri(1, 8)).rejects.toMatchObject({ status: 403 });
  });
});
