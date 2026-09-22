import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/** Hash satu password mentah (unik per user — JANGAN dipakai bersama). */
async function hash(raw: string): Promise<string> {
  return bcrypt.hash(raw, 10);
}

async function main() {
  console.log('🌱 Seeding data PantauSiswa...');

  // ===== CLEAN SLATE: hapus data lama (anak dulu, induk kemudian, aman FK) =====
  await prisma.passwordRequest.deleteMany();
  await prisma.aduan.deleteMany();
  await prisma.peminjaman.deleteMany();
  await prisma.barang.deleteMany();
  await prisma.pengumpulanTugas.deleteMany();
  await prisma.presensi.deleteMany();
  await prisma.pengajuanIzin.deleteMany();
  await prisma.tugas.deleteMany();
  await prisma.sekretaris.deleteMany();
  await prisma.siswa.deleteMany();
  await prisma.guruMapel.deleteMany();
  await prisma.kelas.deleteMany();
  await prisma.guru.deleteMany();
  await prisma.mataPelajaran.deleteMany();
  await prisma.user.deleteMany();
  await prisma.pengaturan.deleteMany();
  console.log('🧹 Data lama dibersihkan.');

  const kredensial: { peran: string; nama: string; email: string; password: string }[] = [];
  const catat = (peran: string, nama: string, email: string, password: string) => {
    kredensial.push({ peran, nama, email, password });
  };

  // ===== ADMIN (password unik) =====
  const adminRaw = 'Admin-Sekolah1!';
  const admin = await prisma.user.create({
    data: {
      email: 'admin@sysch.id',
      password: await hash(adminRaw),
      nama: 'Administrator Sekolah',
      role: 'ADMIN',
    },
  });
  catat('Admin', admin.nama, admin.email, adminRaw);

  // ===== GURU (password unik: Guru-[NIP]) =====
  const guruUsers = [
    { email: 'budi.santoso@guru.sysch.id', nama: 'Drs. Budi Santoso, M.Pd', nip: '196805121994121001', jk: 'L', noHp: '081234567001' },
    { email: 'siti.aminah@guru.sysch.id', nama: 'Siti Aminah, S.Kom', nip: '198203152008012002', jk: 'P', noHp: '081234567002' },
    { email: 'ratna.sari@guru.sysch.id', nama: 'Dra. Ratna Sari, M.Pd', nip: '197511202000032003', jk: 'P', noHp: '081234567003' },
    { email: 'ahmad.hidayat@guru.sysch.id', nama: 'Ahmad Hidayat, S.Pd', nip: '199001152015031004', jk: 'L', noHp: '081234567004' },
  ];
  const gurus: any[] = [];
  for (const g of guruUsers) {
    const raw = `Guru-${g.nip}`;
    const user = await prisma.user.create({
      data: {
        email: g.email,
        password: await hash(raw),
        nama: g.nama,
        role: 'GURU',
        guru: { create: { nip: g.nip, jenisKelamin: g.jk, noHp: g.noHp } },
      },
      include: { guru: true },
    });
    gurus.push(user);
    catat('Guru', g.nama, g.email, raw);
  }

  // ===== MATA PELAJARAN =====
  const mapelNames: [string, string][] = [
    ['Matematika', 'MAT'],
    ['Bahasa Indonesia', 'BIN'],
    ['Fisika', 'FIS'],
    ['Informatika', 'INF'],
    ['Ekonomi', 'EKO'],
  ];
  const mapels: any[] = [];
  for (const [nama, kode] of mapelNames) {
    mapels.push(await prisma.mataPelajaran.create({ data: { nama, kode } }));
  }
  // Relasi guru <-> mapel yang diampu
  const ampuan: [number, number][] = [
    [0, 0], // Budi -> Matematika
    [0, 2], // Budi -> Fisika
    [1, 3], // Siti -> Informatika
    [2, 1], // Ratna -> Bahasa Indonesia
    [3, 2], // Ahmad -> Fisika
    [3, 4], // Ahmad -> Ekonomi
  ];
  for (const [gi, mi] of ampuan) {
    await prisma.guruMapel.create({
      data: { guruId: gurus[gi].guru!.id, mapelId: mapels[mi].id },
    });
  }

  // ===== KELAS =====
  const kelas10A = await prisma.kelas.create({
    data: { nama: '10 MIPA 1', tingkat: '10', waliId: gurus[0].guru!.id },
  });
  const kelas10B = await prisma.kelas.create({
    data: { nama: '10 MIPA 2', tingkat: '10', waliId: gurus[1].guru!.id },
  });
  const kelas11 = await prisma.kelas.create({
    data: { nama: '11 IPS 1', tingkat: '11', waliId: gurus[2].guru!.id },
  });

  // ===== SISWA (password unik: Siswa-[NIS]) =====
  const siswaData = [
    { nama: 'Rizky Ramadhan', nis: '2024001', kelasId: kelas10A.id, jk: 'L', wali: 'Bapak H. Suparman' },
    { nama: 'Putri Ayu Lestari', nis: '2024002', kelasId: kelas10A.id, jk: 'P', wali: 'Ibu Hj. Sulastri' },
    { nama: 'Muhammad Fajar Nugroho', nis: '2024003', kelasId: kelas10A.id, jk: 'L', wali: 'Bapak Drs. Nugroho' },
    { nama: 'Dewi Kusuma Wardani', nis: '2024004', kelasId: kelas10B.id, jk: 'P', wali: 'Ibu Ratih Kusuma' },
    { nama: 'Bagas Aditya Pratama', nis: '2024005', kelasId: kelas10B.id, jk: 'L', wali: 'Bapak Sutrisno' },
    { nama: 'Intan Permata Sari', nis: '2024006', kelasId: kelas10B.id, jk: 'P', wali: 'Ibu Endang Lestari' },
    { nama: 'Yoga Saputra', nis: '2023010', kelasId: kelas11.id, jk: 'L', wali: 'Bapak Bambang Saputra' },
    { nama: 'Maya Anggraini', nis: '2023011', kelasId: kelas11.id, jk: 'P', wali: 'Ibu Sri Wahyuni' },
  ];
  const siswaList: any[] = [];
  for (const s of siswaData) {
    const raw = `Siswa-${s.nis}`;
    const user = await prisma.user.create({
      data: {
        email: `${s.nis}@student.sysch.id`,
        password: await hash(raw),
        nama: s.nama,
        role: 'SISWA',
        siswa: {
          create: {
            nis: s.nis,
            kelasId: s.kelasId,
            jenisKelamin: s.jk,
            waliMurid: s.wali,
          },
        },
      },
      include: { siswa: true },
    });
    siswaList.push(user);
    catat('Siswa', s.nama, `${s.nis}@student.sysch.id`, raw);
  }

  // ===== SEKRETARIS (satu per kelas, password unik per kelas) =====
  const sekretarisData = [
    { email: 'sekretaris.10mipa1@sysch.id', nama: 'Sekretaris Kelas 10 MIPA 1', kelasId: kelas10A.id, slug: '10MIPA1' },
    { email: 'sekretaris.10mipa2@sysch.id', nama: 'Sekretaris Kelas 10 MIPA 2', kelasId: kelas10B.id, slug: '10MIPA2' },
    { email: 'sekretaris.11ips1@sysch.id', nama: 'Sekretaris Kelas 11 IPS 1', kelasId: kelas11.id, slug: '11IPS1' },
  ];
  for (const sk of sekretarisData) {
    const raw = `Sekretaris-${sk.slug}!`;
    await prisma.user.create({
      data: {
        email: sk.email,
        password: await hash(raw),
        nama: sk.nama,
        role: 'SEKRETARIS',
        sekretaris: { create: { kelasId: sk.kelasId } },
      },
    });
    catat('Sekretaris', sk.nama, sk.email, raw);
  }

  // ===== PRESENSI HARI INI =====
  const today = new Date(new Date().toISOString().slice(0, 10));
  for (let i = 0; i < 4; i++) {
    const siswa = siswaList[i].siswa!;
    await prisma.presensi.create({
      data: {
        siswaId: siswa.id,
        tanggal: today,
        status: i === 3 ? 'TERLAMBAT' : 'HADIR',
        checkInAt: new Date(),
        catatan: 'Presensi via fingerprint',
      },
    });
  }
  // Siswa lainnya belum check-in.

  // ===== IZIN (satu pengajuan menunggu) =====
  const besok = new Date(today);
  besok.setDate(besok.getDate() + 1);
  const lusa = new Date(today);
  lusa.setDate(lusa.getDate() + 2);
  await prisma.pengajuanIzin.create({
    data: {
      siswaId: siswaList[1].siswa!.id,
      jenis: 'SAKIT',
      tanggalMulai: besok,
      tanggalSelesai: lusa,
      keterangan: 'Demam dan perlu kontrol ulang ke Puskesmas.',
      lampiranUrl: 'https://example.com/surat-keterangan-sakit.pdf',
    },
  });

  // ===== TUGAS (dengan tanggal diberikan + deadline presisi) =====
  const tigaHariLalu = new Date();
  tigaHariLalu.setDate(tigaHariLalu.getDate() - 3);
  tigaHariLalu.setHours(7, 0, 0, 0);
  const kemarin = new Date();
  kemarin.setDate(kemarin.getDate() - 1);
  kemarin.setHours(10, 0, 0, 0);
  const tenggat1 = new Date();
  tenggat1.setDate(tenggat1.getDate() + 4);
  tenggat1.setHours(23, 59, 0, 0);
  const tenggat2 = new Date();
  tenggat2.setDate(tenggat2.getDate() + 6);
  tenggat2.setHours(23, 59, 0, 0);

  const tugas1 = await prisma.tugas.create({
    data: {
      judul: 'Latihan Soal Trigonometri Bab 3',
      deskripsi:
        'Kerjakan soal halaman 45-50 nomor 1 sampai 20. Tuliskan langkah penyelesaian secara lengkap dan rapi.',
      guruId: gurus[0].guru!.id,
      mapelId: mapels[0].id,
      kelasId: kelas10A.id,
      tanggalDiberikan: tigaHariLalu,
      tenggat: tenggat1,
      jadwalHari: 'Senin',
      jadwalJam: '07:00 - 08:30',
    },
  });
  const tugas2 = await prisma.tugas.create({
    data: {
      judul: 'Laporan Praktikum Hukum II Newton',
      deskripsi:
        'Susun laporan hasil praktikum sesuai format: tujuan, alat dan bahan, langkah kerja, hasil, dan kesimpulan.',
      guruId: gurus[3].guru!.id,
      mapelId: mapels[2].id,
      kelasId: kelas10A.id,
      tanggalDiberikan: kemarin,
      tenggat: tenggat2,
      jadwalHari: 'Rabu',
      jadwalJam: '10:00 - 11:30',
    },
  });

  // Satu pengumpulan contoh
  await prisma.pengumpulanTugas.create({
    data: {
      tugasId: tugas1.id,
      siswaId: siswaList[0].siswa!.id,
      fileUrl: 'https://example.com/jawaban-trigonometri-rizky.pdf',
      catatan: 'Sudah saya kerjakan semua, mohon diperiksa Bapak.',
    },
  });
  void tugas2;

  // ===== BARANG / INVENTARIS (formal & realistis) =====
  const barangs = [
    { nama: 'Proyektor Epson EB-X51', kode: 'INV-PRJ-001', kategori: 'Elektronik', kondisi: 'BAIK' as const, jumlahTotal: 5, jumlahTersedia: 4, lokasi: 'Gudang Sarana' },
    { nama: 'Kabel HDMI 5 Meter', kode: 'INV-KBL-002', kategori: 'Elektronik', kondisi: 'BAIK' as const, jumlahTotal: 10, jumlahTersedia: 9, lokasi: 'Gudang Sarana' },
    { nama: 'Bola Basket Molten B7G4500', kode: 'INV-BSK-003', kategori: 'Olahraga', kondisi: 'BAIK' as const, jumlahTotal: 12, jumlahTersedia: 11, lokasi: 'Ruang Olahraga' },
    { nama: 'Mikroskop Binokuler Olympus CX23', kode: 'INV-MKR-004', kategori: 'Laboratorium', kondisi: 'BAIK' as const, jumlahTotal: 6, jumlahTersedia: 6, lokasi: 'Lab Biologi' },
    { nama: 'Sound System Portable TOA ER-2230', kode: 'INV-SND-005', kategori: 'Elektronik', kondisi: 'BAIK' as const, jumlahTotal: 3, jumlahTersedia: 2, lokasi: 'Aula Sekolah' },
    { nama: 'Laptop Asus VivoBook 14', kode: 'INV-LPT-006', kategori: 'Elektronik', kondisi: 'BAIK' as const, jumlahTotal: 8, jumlahTersedia: 7, lokasi: 'Lab Komputer' },
    { nama: 'Net Voli Yonex', kode: 'INV-VOL-007', kategori: 'Olahraga', kondisi: 'RUSAK_RINGAN' as const, jumlahTotal: 4, jumlahTersedia: 3, lokasi: 'Ruang Olahraga' },
    { nama: 'Whiteboard Magnetik 120x240', kode: 'INV-WBR-008', kategori: 'Furnitur', kondisi: 'BAIK' as const, jumlahTotal: 6, jumlahTersedia: 6, lokasi: 'Gudang Sarana' },
  ];
  const barangRecords: any[] = [];
  for (const b of barangs) {
    barangRecords.push(await prisma.barang.create({ data: b }));
  }

  // Satu pengajuan peminjaman menunggu persetujuan
  const kembali = new Date();
  kembali.setDate(kembali.getDate() + 3);
  await prisma.peminjaman.create({
    data: {
      barangId: barangRecords[0].id,
      siswaId: siswaList[4].siswa!.id,
      jumlah: 1,
      tanggalKembali: kembali,
      jamPinjam: '08:00',
      jamKembali: '12:00',
      catatan: 'Untuk presentasi tugas sejarah di kelas.',
      alasan: 'Presentasi kelompok mata pelajaran Sejarah Indonesia.',
    },
  });

  // ===== ADUAN (formal & realistis) =====
  await prisma.aduan.createMany({
    data: [
      {
        pelaporId: siswaList[0].id,
        judul: 'Kipas angin di kelas 10 MIPA 1 mati',
        deskripsi:
          'Kipas angin plafon di kelas 10 MIPA 1 sudah tiga hari tidak berputar. Siswa tidak nyaman belajar pada siang hari.',
        kategori: 'FASILITAS',
        prioritas: 'TINGGI',
      },
      {
        pelaporId: siswaList[3].id,
        judul: 'Keran air di toilet lantai 2 bocor',
        deskripsi:
          'Keran wastafel toilet putri lantai 2 menetes terus-menerus. Mohon segera diperbaiki agar tidak boros air.',
        kategori: 'FASILITAS',
        prioritas: 'SEDANG',
      },
      {
        pelaporId: siswaList[6].id,
        judul: 'Lampu proyektor di ruang rapat buram',
        deskripsi:
          'Hasil proyeksi di ruang rapat buram sehingga materi presentasi sulit dibaca. Diduga lampu proyektor perlu diganti.',
        kategori: 'FASILITAS',
        prioritas: 'SEDANG',
      },
      {
        pelaporId: siswaList[1].id,
        judul: 'Kartu pelajar kelas 10 belum dicetak',
        deskripsi:
          'Sudah melakukan daftar ulang sejak bulan Juli, tetapi kartu pelajar sampai saat ini belum diterbitkan.',
        kategori: 'ADMINISTRASI',
        prioritas: 'RENDAH',
      },
    ],
  });

  // ===== PENGATURAN SEKOLAH =====
  await prisma.pengaturan.create({
    data: {
      namaSekolah: 'SMA Negeri 1 Harapan Bangsa',
      npsn: '20123456',
      alamat: 'Jl. Pendidikan No. 45, Kediri, Jawa Timur',
      tahunAjaran: '2026/2027',
      semester: 'Ganjil',
      kepalaSekolah: 'Dr. Suryanto, M.Pd.',
      jamMasuk: '07:00',
      batasToleransi: 15,
      notifikasiWA: true,
      notifikasiEmail: false,
    },
  });

  console.log('✅ Seed selesai!');
  console.log('');
  console.log('=== CONTOH AKUN LOGIN (password unik per user) ===');
  console.table([
    { Peran: 'Admin', Nama: admin.nama, Email: admin.email, Password: adminRaw },
    { Peran: 'Guru', Nama: guruUsers[0].nama, Email: guruUsers[0].email, Password: `Guru-${guruUsers[0].nip}` },
    { Peran: 'Siswa', Nama: siswaData[0].nama, Email: `${siswaData[0].nis}@student.sysch.id`, Password: `Siswa-${siswaData[0].nis}` },
  ]);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
