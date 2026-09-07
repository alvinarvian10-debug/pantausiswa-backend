import { Injectable } from '@nestjs/common';
import { StatusPresensi } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.module';

@Injectable()
export class AnalitikService {
  constructor(private prisma: PrismaService) {}

  /** Kartu ringkasan dashboard admin */
  async ringkasan() {
    const today = new Date(new Date().toISOString().slice(0, 10));

    const [
      totalSiswa,
      totalGuru,
      totalKelas,
      presensiHariIni,
      tugasAktif,
      aduanBaru,
      totalTugas,
      totalPeminjaman,
      totalAduan,
    ] = await this.prisma.$transaction([
      this.prisma.siswa.count(),
      this.prisma.guru.count(),
      this.prisma.kelas.count(),
      this.prisma.presensi.findMany({ where: { tanggal: today } }),
      this.prisma.tugas.count({ where: { tenggat: { gte: new Date() } } }),
      this.prisma.aduan.count({ where: { status: 'BARU' } }),
      this.prisma.tugas.count(),
      this.prisma.peminjaman.count(),
      this.prisma.aduan.count(),
    ]);

    const hadir = presensiHariIni.filter(
      (p) => p.status === 'HADIR' || p.status === 'TERLAMBAT',
    ).length;
    const persenKehadiran =
      totalSiswa > 0 ? Math.round((hadir / totalSiswa) * 100) : 0;

    return {
      totalSiswa,
      totalGuru,
      totalKelas,
      kehadiranHariIni: {
        hadir,
        tercatat: presensiHariIni.length,
        persentase: persenKehadiran,
      },
      tugasAktif,
      aduanBaru,
      totalTugas,
      totalPeminjaman,
      totalAduan,
    };
  }

  /** Tren kehadiran N hari terakhir (untuk line chart) */
  async trenKehadiran(days = 14) {
    const result: { tanggal: string; persentase: number; hadir: number; total: number }[] =
      [];

    const totalSiswa = await this.prisma.siswa.count();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const tanggal = new Date(d.toISOString().slice(0, 10));

      const dayData = await this.prisma.presensi.groupBy({
        by: ['status'],
        where: { tanggal },
        _count: true,
      });

      const hadir = dayData
        .filter((r) => r.status === 'HADIR' || r.status === 'TERLAMBAT' || r.status === 'IZIN')
        .reduce((sum, r) => sum + r._count, 0);

      result.push({
        tanggal: tanggal.toISOString().slice(0, 10),
        hadir,
        total: totalSiswa,
        persentase:
          totalSiswa > 0 ? Math.round((hadir / totalSiswa) * 100) : 0,
      });
    }

    return result;
  }

  /** Persentase kehadiran per kelas hari ini / rentang */
  async perKelas(tanggal?: string) {
    const t = tanggal
      ? new Date(tanggal)
      : new Date(new Date().toISOString().slice(0, 10));

    const kelasList = await this.prisma.kelas.findMany({
      include: {
        _count: { select: { siswa: true } },
        siswa: {
          include: {
            presensi: { where: { tanggal: t }, select: { status: true } },
          },
        },
      },
      orderBy: { nama: 'asc' },
    });

    return kelasList.map((k) => {
      const hadir = k.siswa.filter(
        (s) =>
          s.presensi[0]?.status === 'HADIR' ||
          s.presensi[0]?.status === 'TERLAMBAT',
      ).length;
      const total = k._count.siswa;
      return {
        kelasId: k.id,
        nama: k.nama,
        tingkat: k.tingkat,
        totalSiswa: total,
        hadir,
        persentase: total > 0 ? Math.round((hadir / total) * 100) : 0,
      };
    });
  }

  /** Distribusi status aduan (untuk pie chart) */
  async distribusiAduan() {
    const grouped = await this.prisma.aduan.groupBy({
      by: ['status'],
      _count: true,
    });
    const distribusiStatus = Object.fromEntries(
      grouped.map((g) => [g.status, g._count]),
    );

    const byPrioritas = await this.prisma.aduan.groupBy({
      by: ['prioritas'],
      _count: true,
    });

    return {
      status: distribusiStatus as Record<StatusPresensi | string, number>,
      prioritas: Object.fromEntries(byPrioritas.map((p) => [p.prioritas, p._count])),
    };
  }

  /** Statistik tugas per mapel untuk guru/admin */
  async statistikTugas() {
    const tugas = await this.prisma.tugas.findMany({
      include: {
        mapel: { select: { nama: true } },
        kelas: { select: { nama: true } },
        _count: { select: { kumpulan: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return tugas.map((t) => ({
      id: t.id,
      judul: t.judul,
      mapel: t.mapel.nama,
      kelas: t.kelas.nama,
      tenggat: t.tenggat,
      jumlahPengumpulan: t._count.kumpulan,
    }));
  }

  /** Rata-rata nilai keseluruhan + per mapel (dari pengumpulan yang dinilai). */
  async statistikNilai() {
    const dinilai = await this.prisma.pengumpulanTugas.findMany({
      where: { nilai: { not: null } },
      select: {
        nilai: true,
        tugas: { select: { mapel: { select: { nama: true } } } },
      },
    });

    const perMapel = new Map<string, { total: number; count: number }>();
    let total = 0;
    for (const s of dinilai) {
      total += s.nilai ?? 0;
      const nama = s.tugas.mapel.nama;
      const agg = perMapel.get(nama) ?? { total: 0, count: 0 };
      agg.total += s.nilai ?? 0;
      agg.count += 1;
      perMapel.set(nama, agg);
    }

    return {
      rataRata: dinilai.length > 0 ? Math.round(total / dinilai.length) : 0,
      totalDinilai: dinilai.length,
      perMapel: [...perMapel.entries()].map(([mapel, v]) => ({
        mapel,
        rata: Math.round(v.total / v.count),
        count: v.count,
      })),
    };
  }
}
