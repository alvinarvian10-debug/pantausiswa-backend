import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding data PantauSiswa...');

  const password = await bcrypt.hash('password123', 10);

  // ===== ADMIN =====
  const admin = await prisma.user.upsert({
    where: { email: 'admin@sysch.id' },
    update: {},
    create: {
      email: 'admin@sysch.id',
      password,
      nama: 'Admin Sekolah',
      role: 'ADMIN',
    },
  });

  // ===== GURU =====
  const guruUsers = [
    { email: 'budi@sysch.id', nama: 'Budi Santoso, S.Pd', nip: '198705122010011005' },
    { email: 'sari@sysch.id', nama: 'Sari Wulandari, M.Pd', nip: '199203182015022008' },
  ];
  const gurus: any[] = [];
  for (const g of guruUsers) {
    const user = await prisma.user.upsert({
      where: { email: g.email },
      update: {},
      create: {
        email: g.email,
        password,
        nama: g.nama,
        role: 'GURU',
        guru: { create: { nip: g.nip, jenisKelamin: 'L' } },
      },
      include: { guru: true },
    });
    gurus.push(user);
  }

  // ===== KELAS =====
  const kelas10 = await prisma.kelas.upsert({
    where: { nama: '10 MIPA 1' },
    update: {},
    create: {
      nama: '10 MIPA 1',
      tingkat: '10',
      waliId: gurus[0].guru!.id,
    },
  });
  const kelas11 = await prisma.kelas.upsert({
    where: { nama: '11 IPS 2' },
    update: {},
    create: {
      nama: '11 IPS 2',
      tingkat: '11',
      waliId: gurus[1].guru!.id,
    },
  });

  // ===== SISWA =====
  const siswaData = [
    { email: 'fauzi@student.sysch.id', nama: 'Fauzi Alfi', nis: '2024001', kelasId: kelas10.id },
    { email: 'rina@student.sysch.id', nama: 'Rina Amelia', nis: '2024002', kelasId: kelas10.id },
    { email: 'dimas@student.sysch.id', nama: 'Dimas Prakoso', nis: '2024003', kelasId: kelas10.id },
    { email: 'sinta@student.sysch.id', nama: 'Sinta Maharani', nis: '2023010', kelasId: kelas11.id },
    { email: 'andre@student.sysch.id', nama: 'Andre Wijaya', nis: '2023011', kelasId: kelas11.id },
  ];
  const siswaList: any[] = [];
  for (const s of siswaData) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        email: s.email,
        password,
        nama: s.nama,
        role: 'SISWA',
        siswa: {
          create: {
            nis: s.nis,
            kelasId: s.kelasId,
            jenisKelamin: s.nama.startsWith('Rina') || s.nama.startsWith('Sinta') ? 'P' : 'L',
            waliMurid: `Orang tua ${s.nama.split(' ')[0]}`,
          },
        },
      },
      include: { siswa: true },
    });
    siswaList.push(user);
  }

  // ===== SEKRETARIS (satu per kelas) =====
  const sekretarisData = [
    { email: 'sekretaris.mipa1@sysch.id', nama: 'Sekretaris 10 MIPA 1', kelasId: kelas10.id },
    { email: 'sekretaris.ips2@sysch.id', nama: 'Sekretaris 11 IPS 2', kelasId: kelas11.id },
  ];
  for (const sk of sekretarisData) {
    await prisma.user.upsert({
      where: { email: sk.email },
      update: {},
      create: {
        email: sk.email,
        password,
        nama: sk.nama,
        role: 'SEKRETARIS',
        sekretaris: { create: { kelasId: sk.kelasId } },
      },
    });
  }

  // ===== MAPEL =====
  const mapelNames = [
    ['Matematika', 'MAT'],
    ['Bahasa Indonesia', 'BIN'],
    ['Fisika', 'FIS'],
    ['Ekonomi', 'EKO'],
  ];
  const mapels: any[] = [];
  for (const [nama, kode] of mapelNames) {
    const mapel = await prisma.mataPelajaran.upsert({
      where: { kode },
      update: {},
      create: { nama, kode },
    });
    mapels.push(mapel);
  }

  // ===== PRESENSI HARI INI =====
  const today = new Date(new Date().toISOString().slice(0, 10));
  for (let i = 0; i < 4; i++) {
    const siswa = siswaList[i].siswa!;
    await prisma.presensi.upsert({
      where: { siswaId_tanggal: { siswaId: siswa.id, tanggal: today } },
      update: {},
      create: {
        siswaId: siswa.id,
        tanggal: today,
        status: i === 3 ? 'TERLAMBAT' : 'HADIR',
        checkInAt: new Date(),
      },
    });
  }
  // siswa ke-5 belum check-in => ALPA

  // ===== IZIN =====
  const besok = new Date(today);
  besok.setDate(besok.getDate() + 1);
  const lusa = new Date(today);
  lusa.setDate(lusa.getDate() + 2);

  const existingIzin = await prisma.pengajuanIzin.findFirst({
    where: { siswaId: siswaList[1].siswa!.id, status: 'MENUNGGU' },
  });
  if (!existingIzin) {
    await prisma.pengajuanIzin.create({
      data: {
        siswaId: siswaList[1].siswa!.id,
        jenis: 'SAKIT',
        tanggalMulai: besok,
        tanggalSelesai: lusa,
        keterangan: 'Demam dan perlu kontrol ke dokter.',
        lampiranUrl: 'https://example.com/surat-sakit.pdf',
      },
    });
  }

  // ===== TUGAS =====
  const existingTugas = await prisma.tugas.findFirst();
  if (!existingTugas) {
    const tugas = await prisma.tugas.create({
      data: {
        judul: 'Latihan Trigonometri Bab 3',
        deskripsi:
          'Kerjakan soal halaman 45-50 nomor 1 sampai 20. Tuliskan langkah penyelesaian lengkap.',
        guruId: gurus[0].guru!.id,
        mapelId: mapels[0].id,
        kelasId: kelas10.id,
        tenggat: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
    });

    // satu submission contoh
    await prisma.pengumpulanTugas.create({
      data: {
        tugasId: tugas.id,
        siswaId: siswaList[0].siswa!.id,
        fileUrl: 'https://example.com/jawaban-fauzi.pdf',
        catatan: 'Sudah saya kerjakan semua, mohon dicek pak.',
      },
    });
  }

  // ===== BARANG / INVENTARIS =====
  const barangs = [
    { nama: 'Proyektor Epson EB-X51', kode: 'INV-PRJ-001', kategori: 'Elektronik', jumlahTotal: 5 },
    { nama: 'Laptop Lenovo ThinkPad', kode: 'INV-LPT-002', kategori: 'Elektronik', jumlahTotal: 10 },
    { nama: 'Bola Voli Mikasa', kode: 'INV-VOL-003', kategori: 'Olahraga', jumlahTotal: 8 },
  ];
  const barangRecords: any[] = [];
  for (const b of barangs) {
    const barang = await prisma.barang.upsert({
      where: { kode: b.kode },
      update: {},
      create: { ...b, jumlahTersedia: b.jumlahTotal },
    });
    barangRecords.push(barang);
  }

  // contoh pengajuan peminjaman pending
  const existingPinjam = await prisma.peminjaman.findFirst({
    where: { siswaId: siswaList[2].siswa!.id, status: 'MENUNGGU' },
  });
  if (!existingPinjam && barangRecords[0]) {
    const kembali = new Date();
    kembali.setDate(kembali.getDate() + 3);
    await prisma.peminjaman.create({
      data: {
        barangId: barangRecords[0].id,
        siswaId: siswaList[2].siswa!.id,
        jumlah: 1,
        tanggalKembali: kembali,
        catatan: 'Untuk presentasi PKL di kelas.',
      },
    });
  }

  // ===== ADUAN =====
  const existingAduan = await prisma.aduan.findFirst({
    where: { pelaporId: siswaList[0].id },
  });
  if (!existingAduan) {
    await prisma.aduan.createMany({
      data: [
        {
          pelaporId: siswaList[0].id,
          judul: 'AC ruang kelas 10 MIPA 1 mati',
          deskripsi:
            'AC di kelas sudah 3 hari tidak dingin, siswa tidak nyaman belajar siang hari.',
          kategori: 'FASILITAS',
          prioritas: 'TINGGI',
        },
        {
          pelaporId: siswaList[3].id,
          judul: 'Kartu pelajar belum dicetak',
          deskripsi: 'Sudah daftar ulang sejak bulan Juli tapi kartu pelajar belum keluar.',
          kategori: 'ADMINISTRASI',
          prioritas: 'RENDAH',
        },
      ],
    });
  }

  console.log('✅ Seed selesai!');
  console.log('');
  console.log('=== AKUN LOGIN (semua password: password123) ===');
  console.log(`Admin : ${admin.email}`);
  console.log(`Guru  : ${guruUsers.map((g) => g.email).join(', ')}`);
  console.log(`Siswa : ${siswaData.map((s) => s.email).join(', ')}`);
  console.log(`Sekretaris : ${sekretarisData.map((s) => s.email).join(', ')}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
