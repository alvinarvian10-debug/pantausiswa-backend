import { GuruService } from './guru.service';

function mockPrisma() {
  return {
    user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn(), findMany: jest.fn() },
    guru: { findUnique: jest.fn(), update: jest.fn() },
    mataPelajaran: { findMany: jest.fn() },
    guruMapel: { deleteMany: jest.fn(), createMany: jest.fn() },
    $transaction: jest.fn(),
  };
}

describe('GuruService mapel', () => {
  let prisma: ReturnType<typeof mockPrisma>;
  let service: GuruService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = mockPrisma();
    service = new GuruService(prisma as any);
  });

  it('create memasangkan mapel yang valid', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ id: 11, guru: { id: 5 } });
    prisma.mataPelajaran.findMany.mockResolvedValue([{ id: 2 }, { id: 3 }]);
    prisma.guruMapel.createMany.mockResolvedValue({ count: 2 });
    prisma.guru.findUnique.mockResolvedValue({
      id: 5,
      mapelDiampu: [{ mapel: { id: 2, nama: 'Matematika' } }],
    });
    const res: any = await service.create({
      email: 'g@g.id',
      password: 'password123',
      nama: 'Guru Tes',
      nip: 'NIP-1',
      mapelIds: [2, 3, 999],
    });
    expect(prisma.guruMapel.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [
          { guruId: 5, mapelId: 2 },
          { guruId: 5, mapelId: 3 },
        ],
      }),
    );
    expect(res.mapel).toEqual(['Matematika']);
  });

  it('update mengganti daftar mapel', async () => {
    prisma.guru.findUnique.mockResolvedValue({ id: 5, userId: 11 });
    const tx = {
      user: { update: jest.fn() },
      guru: { update: jest.fn(), findUnique: jest.fn() },
    };
    prisma.$transaction.mockImplementation(async (cb: any) =>
      typeof cb === 'function' ? cb(tx) : cb,
    );
    prisma.mataPelajaran.findMany.mockResolvedValue([{ id: 4 }]);
    prisma.guruMapel.deleteMany.mockResolvedValue({});
    prisma.guruMapel.createMany.mockResolvedValue({ count: 1 });
    prisma.guru.findUnique.mockResolvedValue({
      id: 5,
      mapelDiampu: [{ mapel: { id: 4, nama: 'Fisika' } }],
    });
    const res: any = await service.update(5, { mapelIds: [4] });
    expect(prisma.guruMapel.deleteMany).toHaveBeenCalledWith({
      where: { guruId: 5 },
    });
    expect(res.mapel).toEqual(['Fisika']);
  });
});
