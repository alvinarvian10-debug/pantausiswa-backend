-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'GURU', 'SISWA') NOT NULL DEFAULT 'SISWA',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `guru` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `nip` VARCHAR(30) NOT NULL,
    `noHp` VARCHAR(20) NULL,
    `jenisKelamin` VARCHAR(1) NULL,
    `alamat` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `guru_userId_key`(`userId`),
    UNIQUE INDEX `guru_nip_key`(`nip`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kelas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(50) NOT NULL,
    `tingkat` VARCHAR(10) NOT NULL,
    `waliId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `kelas_nama_key`(`nama`),
    UNIQUE INDEX `kelas_waliId_key`(`waliId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `siswa` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `nis` VARCHAR(30) NOT NULL,
    `kelasId` INTEGER NULL,
    `jenisKelamin` VARCHAR(1) NULL,
    `tanggalLahir` DATETIME(3) NULL,
    `alamat` TEXT NULL,
    `noHp` VARCHAR(20) NULL,
    `waliMurid` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `siswa_userId_key`(`userId`),
    UNIQUE INDEX `siswa_nis_key`(`nis`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mata_pelajaran` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(100) NOT NULL,
    `kode` VARCHAR(20) NOT NULL,

    UNIQUE INDEX `mata_pelajaran_nama_key`(`nama`),
    UNIQUE INDEX `mata_pelajaran_kode_key`(`kode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `presensi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `siswaId` INTEGER NOT NULL,
    `tanggal` DATE NOT NULL,
    `status` ENUM('HADIR', 'TERLAMBAT', 'IZIN', 'SAKIT', 'ALPA') NOT NULL DEFAULT 'HADIR',
    `checkInAt` DATETIME(3) NULL,
    `catatan` VARCHAR(255) NULL,

    INDEX `presensi_tanggal_idx`(`tanggal`),
    UNIQUE INDEX `presensi_siswaId_tanggal_key`(`siswaId`, `tanggal`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pengajuan_izin` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `siswaId` INTEGER NOT NULL,
    `jenis` ENUM('IZIN', 'SAKIT', 'DISPENSASI') NOT NULL DEFAULT 'IZIN',
    `tanggalMulai` DATE NOT NULL,
    `tanggalSelesai` DATE NOT NULL,
    `keterangan` VARCHAR(500) NOT NULL,
    `lampiranUrl` VARCHAR(255) NULL,
    `status` ENUM('MENUNGGU', 'DISETUJUI', 'DITOLAK') NOT NULL DEFAULT 'MENUNGGU',
    `reviewerId` INTEGER NULL,
    `catatanReview` VARCHAR(255) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `pengajuan_izin_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tugas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `judul` VARCHAR(191) NOT NULL,
    `deskripsi` TEXT NOT NULL,
    `guruId` INTEGER NOT NULL,
    `mapelId` INTEGER NOT NULL,
    `kelasId` INTEGER NOT NULL,
    `tenggat` DATETIME(3) NOT NULL,
    `lampiranUrl` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pengumpulan_tugas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tugasId` INTEGER NOT NULL,
    `siswaId` INTEGER NOT NULL,
    `fileUrl` VARCHAR(255) NOT NULL,
    `catatan` VARCHAR(255) NULL,
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `nilai` INTEGER NULL,
    `feedback` VARCHAR(255) NULL,
    `dinilaiAt` DATETIME(3) NULL,

    UNIQUE INDEX `pengumpulan_tugas_tugasId_siswaId_key`(`tugasId`, `siswaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `barang` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(100) NOT NULL,
    `kode` VARCHAR(30) NOT NULL,
    `kategori` VARCHAR(50) NOT NULL,
    `kondisi` ENUM('BAIK', 'RUSAK_RINGAN', 'RUSAK_BERAT') NOT NULL DEFAULT 'BAIK',
    `jumlahTotal` INTEGER NOT NULL DEFAULT 0,
    `jumlahTersedia` INTEGER NOT NULL DEFAULT 0,
    `lokasi` VARCHAR(100) NULL,
    `fotoUrl` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `barang_kode_key`(`kode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `peminjaman` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `barangId` INTEGER NOT NULL,
    `siswaId` INTEGER NOT NULL,
    `jumlah` INTEGER NOT NULL DEFAULT 1,
    `tanggalPinjam` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `tanggalKembali` DATE NOT NULL,
    `dikembalikanAt` DATETIME(3) NULL,
    `status` ENUM('MENUNGGU', 'DIPINJAM', 'DIKEMBALIKAN', 'DITOLAK') NOT NULL DEFAULT 'MENUNGGU',
    `catatan` VARCHAR(255) NULL,

    INDEX `peminjaman_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `aduan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pelaporId` INTEGER NOT NULL,
    `judul` VARCHAR(191) NOT NULL,
    `deskripsi` TEXT NOT NULL,
    `kategori` ENUM('FASILITAS', 'ADMINISTRASI', 'LAINNYA') NOT NULL DEFAULT 'FASILITAS',
    `prioritas` ENUM('RENDAH', 'SEDANG', 'TINGGI') NOT NULL DEFAULT 'SEDANG',
    `status` ENUM('BARU', 'DIPROSES', 'SELESAI', 'DITOLAK') NOT NULL DEFAULT 'BARU',
    `lampiranUrl` VARCHAR(255) NULL,
    `tanggapan` TEXT NULL,
    `penanggapId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `aduan_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `guru` ADD CONSTRAINT `guru_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kelas` ADD CONSTRAINT `kelas_waliId_fkey` FOREIGN KEY (`waliId`) REFERENCES `guru`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `siswa` ADD CONSTRAINT `siswa_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `siswa` ADD CONSTRAINT `siswa_kelasId_fkey` FOREIGN KEY (`kelasId`) REFERENCES `kelas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `presensi` ADD CONSTRAINT `presensi_siswaId_fkey` FOREIGN KEY (`siswaId`) REFERENCES `siswa`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengajuan_izin` ADD CONSTRAINT `pengajuan_izin_siswaId_fkey` FOREIGN KEY (`siswaId`) REFERENCES `siswa`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengajuan_izin` ADD CONSTRAINT `pengajuan_izin_reviewerId_fkey` FOREIGN KEY (`reviewerId`) REFERENCES `guru`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tugas` ADD CONSTRAINT `tugas_guruId_fkey` FOREIGN KEY (`guruId`) REFERENCES `guru`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tugas` ADD CONSTRAINT `tugas_mapelId_fkey` FOREIGN KEY (`mapelId`) REFERENCES `mata_pelajaran`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tugas` ADD CONSTRAINT `tugas_kelasId_fkey` FOREIGN KEY (`kelasId`) REFERENCES `kelas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengumpulan_tugas` ADD CONSTRAINT `pengumpulan_tugas_tugasId_fkey` FOREIGN KEY (`tugasId`) REFERENCES `tugas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengumpulan_tugas` ADD CONSTRAINT `pengumpulan_tugas_siswaId_fkey` FOREIGN KEY (`siswaId`) REFERENCES `siswa`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `peminjaman` ADD CONSTRAINT `peminjaman_barangId_fkey` FOREIGN KEY (`barangId`) REFERENCES `barang`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `peminjaman` ADD CONSTRAINT `peminjaman_siswaId_fkey` FOREIGN KEY (`siswaId`) REFERENCES `siswa`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aduan` ADD CONSTRAINT `aduan_pelaporId_fkey` FOREIGN KEY (`pelaporId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aduan` ADD CONSTRAINT `aduan_penanggapId_fkey` FOREIGN KEY (`penanggapId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
