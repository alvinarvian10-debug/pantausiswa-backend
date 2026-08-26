import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.module';
import {
  CreateSubmissionDto,
  CreateTugasDto,
  NilaiSubmissionDto,
  UpdateTugasDto,
} from './dto';

@Injectable()
export class TugasService {
  constructor(private prisma: PrismaService) {}

  async create(guruUserId: number, dto: CreateTugasDto) {
    const guru = await this.prisma.guru.findUnique({
      where: { userId: guruUserId },
    });
    if (!guru) throw new ForbiddenException('Akun ini bukan guru');

    return this.prisma.tugas.create({
      data: {
        judul: dto.judul,
        deskripsi: dto.deskripsi,
        guruId: guru.id,
        mapelId: dto.mapelId,
        kelasId: dto.kelasId,
        tenggat: new Date(dto.tenggat),
        lampiranUrl: dto.lampiranUrl ?? null,
      },
      include: {
        mapel: { select: { nama: true, kode: true } },
        kelas: { select: { nama: true } },
        _count: { select: { kumpulan: true } },
      },
    });
  }

  /** Daftar tugas untuk guru/admin */
  async findAll(opts: { kelasId?: number; guruUserId?: number }) {
    const where: Record<string, unknown> = {};
    if (opts.kelasId) where.kelasId = opts.kelasId;
    if (opts.guruUserId) {
      const guru = await this.prisma.guru.findUnique({
        where: { userId: opts.guruUserId },
      });
      if (guru) where.guruId = guru.id;
    }
    return this.prisma.tugas.findMany({
      where,
      include: {
        mapel: { select: { nama: true, kode: true } },
        kelas: { select: { nama: true } },
        guru: { include: { user: { select: { nama: true } } } },
        _count: { select: { kumpulan: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Daftar tugas untuk siswa (sesuai kelasnya) + status pengumpulan dia */
  async findForSiswa(siswaUserId: number) {
    const siswa = await this.prisma.siswa.findUnique({
      where: { userId: siswaUserId },
    });
    if (!siswa || !siswa.kelasId) {
      throw new ForbiddenException('Anda belum terdaftar di kelas manapun');
    }

    const tugas = await this.prisma.tugas.findMany({
      where: { kelasId: siswa.kelasId },
      include: {
        mapel: { select: { nama: true, kode: true } },
        guru: { include: { user: { select: { nama: true } } } },
        kumpulan: { where: { siswaId: siswa.id } },
      },
      orderBy: { tenggat: 'desc' },
    });

    return tugas.map((t) => ({
      ...t,
      submissionSaya: t.kumpulan[0] ?? null,
      sudahMengumpulkan: t.kumpulan.length > 0,
      kumpulan: undefined,
    }));
  }

  async findOne(id: number) {
    const tugas = await this.prisma.tugas.findUnique({
      where: { id },
      include: {
        mapel: { select: { nama: true, kode: true } },
        kelas: { select: { nama: true } },
        guru: { include: { user: { select: { nama: true } } } },
        kumpulan: {
          include: { siswa: { include: { user: { select: { nama: true } } } } },
        },
      },
    });
    if (!tugas) throw new NotFoundException('Tugas tidak ditemukan');
    return tugas;
  }

  async update(id: number, guruUserId: number, dto: UpdateTugasDto) {
    await this.ensureOwner(id, guruUserId);
    const data: Record<string, unknown> = {};
    for (const key of ['judul', 'deskripsi', 'lampiranUrl'] as const) {
      if (dto[key] !== undefined) data[key] = dto[key];
    }
    if (dto.mapelId !== undefined) data.mapelId = dto.mapelId;
    if (dto.kelasId !== undefined) data.kelasId = dto.kelasId;
    if (dto.tenggat !== undefined) data.tenggat = new Date(dto.tenggat);

    return this.prisma.tugas.update({
      where: { id },
      data,
      include: { mapel: true, kelas: true },
    });
  }

  async remove(id: number, guruUserId: number) {
    await this.ensureOwner(id, guruUserId);
    await this.prisma.tugas.delete({ where: { id } });
    return { message: 'Tugas berhasil dihapus' };
  }

  /** Siswa mengumpulkan/mengunggah jawaban */
  async submit(tugasId: number, siswaUserId: number, dto: CreateSubmissionDto) {
    const siswa = await this.prisma.siswa.findUnique({
      where: { userId: siswaUserId },
    });
    if (!siswa) throw new ForbiddenException('Akun ini bukan siswa aktif');

    const tugas = await this.prisma.tugas.findUnique({
      where: { id: tugasId },
    });
    if (!tugas) throw new NotFoundException('Tugas tidak ditemukan');
    if (new Date() > tugas.tenggat) {
      throw new BadRequestException(
        'Tenggat pengumpulan sudah lewat, hubungi gurumu',
      );
    }

    return this.prisma.pengumpulanTugas.upsert({
      where: { tugasId_siswaId: { tugasId, siswaId: siswa.id } },
      create: {
        tugasId,
        siswaId: siswa.id,
        fileUrl: dto.fileUrl,
        catatan: dto.catatan ?? null,
      },
      update: {
        fileUrl: dto.fileUrl,
        catatan: dto.catatan ?? null,
        submittedAt: new Date(),
      },
    });
  }

  /** Guru melihat semua pengumpulan untuk tugasnya */
  async getSubmissions(tugasId: number, guruUserId: number) {
    await this.ensureOwner(tugasId, guruUserId);
    return this.prisma.pengumpulanTugas.findMany({
      where: { tugasId },
      include: {
        siswa: {
          include: { user: { select: { nama: true } }, kelas: true },
        },
      },
      orderBy: { submittedAt: 'asc' },
    });
  }

  /** Guru menilai pengumpulan */
  async grade(
    submissionId: number,
    guruUserId: number,
    dto: NilaiSubmissionDto,
  ) {
    const submission = await this.prisma.pengumpulanTugas.findUnique({
      where: { id: submissionId },
      include: { tugas: true },
    });
    if (!submission) {
      throw new NotFoundException('Pengumpulan tugas tidak ditemukan');
    }
    await this.ensureOwner(submission.tugasId, guruUserId);

    return this.prisma.pengumpulanTugas.update({
      where: { id: submissionId },
      data: {
        nilai: dto.nilai,
        feedback: dto.feedback ?? null,
        dinilaiAt: new Date(),
      },
    });
  }

  /** Nilai semua tugas milik siswa yang login */
  async myGrades(siswaUserId: number) {
    const siswa = await this.prisma.siswa.findUnique({
      where: { userId: siswaUserId },
    });
    if (!siswa) throw new ForbiddenException('Akun ini bukan siswa aktif');

    return this.prisma.pengumpulanTugas.findMany({
      where: { siswaId: siswa.id, nilai: { not: null } },
      include: {
        tugas: {
          select: { judul: true },
          include: { mapel: { select: { nama: true } } },
        },
      },
      orderBy: { dinilaiAt: 'desc' },
    });
  }

  private async ensureOwner(tugasId: number, guruUserId: number) {
    const tugas = await this.prisma.tugas.findUnique({
      where: { id: tugasId },
      include: { guru: true },
    });
    if (!tugas) throw new NotFoundException('Tugas tidak ditemukan');
    if (tugas.guru.userId !== guruUserId) {
      // admin boleh
      const user = await this.prisma.user.findUnique({
        where: { id: guruUserId },
      });
      if (user?.role !== 'ADMIN') {
        throw new ForbiddenException('Tugas ini bukan milik Anda');
      }
    }
    return tugas;
  }
}
