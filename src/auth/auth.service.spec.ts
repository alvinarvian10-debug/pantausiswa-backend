import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';

function mockPrisma() {
  return {
    user: { findUnique: jest.fn(), update: jest.fn() },
  };
}

describe('AuthService', () => {
  let prisma: ReturnType<typeof mockPrisma>;
  let service: AuthService;
  let passwordHash: string;

  beforeAll(async () => {
    passwordHash = await bcrypt.hash('password123', 10);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = mockPrisma();
    const jwt = { signAsync: jest.fn().mockResolvedValue('signed-token') };
    service = new AuthService(prisma as any, jwt as any);
  });

  it('login sukses mengembalikan token + user', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      email: 'admin@sysch.id',
      password: passwordHash,
      nama: 'Admin',
      role: 'ADMIN',
    });
    const res = await service.login('admin@sysch.id', 'password123');
    expect(res.accessToken).toBe('signed-token');
    expect(res.user.role).toBe('ADMIN');
  });

  it('login user tak dikenal ditolak 401', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.login('x@x.id', 'password123')).rejects.toMatchObject({
      status: 401,
    });
  });

  it('login password salah ditolak 401', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      email: 'a@b.id',
      password: passwordHash,
      nama: 'A',
      role: 'SISWA',
    });
    await expect(service.login('a@b.id', 'salah')).rejects.toMatchObject({
      status: 401,
    });
  });

  it('getProfile mengembalikan user yang ada', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 2, email: 'g@g.id' });
    await expect(service.getProfile(2)).resolves.toMatchObject({ id: 2 });
  });

  it('getProfile user hilang ditolak 401', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.getProfile(99)).rejects.toMatchObject({ status: 401 });
  });

  it('adminSetPassword by email meng-hash password baru', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 3, email: 's@s.id' });
    prisma.user.update.mockResolvedValue({});
    const res = await service.adminSetPassword({
      email: 's@s.id',
      newPassword: 'baruku123',
    });
    expect(res.message).toContain('s@s.id');
    const hash = prisma.user.update.mock.calls[0][0].data.password as string;
    expect(hash).not.toBe('baruku123');
    await expect(bcrypt.compare('baruku123', hash)).resolves.toBe(true);
  });

  it('adminSetPassword tanpa identifier ditolak 400', async () => {
    await expect(
      service.adminSetPassword({ newPassword: 'baruku123' } as any),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('adminSetPassword akun tak ada ditolak 404', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(
      service.adminSetPassword({ email: 'x@x.id', newPassword: 'baruku123' }),
    ).rejects.toMatchObject({ status: 404 });
  });
});
