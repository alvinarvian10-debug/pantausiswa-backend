-- AlterTable
ALTER TABLE `aduan` ADD COLUMN `isAnonim` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `barang` ADD COLUMN `icon` VARCHAR(50) NULL;

-- CreateTable
CREATE TABLE `guru_mapel` (
    `guruId` INTEGER NOT NULL,
    `mapelId` INTEGER NOT NULL,

    PRIMARY KEY (`guruId`, `mapelId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `guru_mapel` ADD CONSTRAINT `guru_mapel_guruId_fkey` FOREIGN KEY (`guruId`) REFERENCES `guru`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `guru_mapel` ADD CONSTRAINT `guru_mapel_mapelId_fkey` FOREIGN KEY (`mapelId`) REFERENCES `mata_pelajaran`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
