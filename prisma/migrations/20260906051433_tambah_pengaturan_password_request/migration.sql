-- CreateTable
CREATE TABLE `pengaturan` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `namaSekolah` VARCHAR(191) NOT NULL,
    `npsn` VARCHAR(30) NOT NULL,
    `alamat` TEXT NULL,
    `tahunAjaran` VARCHAR(20) NOT NULL,
    `semester` VARCHAR(10) NOT NULL,
    `kepalaSekolah` VARCHAR(191) NULL,
    `jamMasuk` VARCHAR(5) NOT NULL,
    `batasToleransi` INTEGER NOT NULL DEFAULT 15,
    `notifikasiWA` BOOLEAN NOT NULL DEFAULT true,
    `notifikasiEmail` BOOLEAN NOT NULL DEFAULT false,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `password_request` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `requesterId` INTEGER NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `status` ENUM('MENUNGGU', 'DISETUJUI', 'DITOLAK') NOT NULL DEFAULT 'MENUNGGU',
    `catatan` VARCHAR(255) NULL,
    `reviewerId` INTEGER NULL,
    `reviewedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `password_request_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `password_request` ADD CONSTRAINT `password_request_requesterId_fkey` FOREIGN KEY (`requesterId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `password_request` ADD CONSTRAINT `password_request_reviewerId_fkey` FOREIGN KEY (`reviewerId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
