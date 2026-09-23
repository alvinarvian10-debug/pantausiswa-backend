-- AlterTable
ALTER TABLE `User` MODIFY `role` ENUM('ADMIN', 'GURU', 'SISWA', 'SEKRETARIS') NOT NULL DEFAULT 'SISWA';

-- CreateTable
CREATE TABLE `sekretaris` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `kelasId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `sekretaris_userId_key`(`userId`),
    UNIQUE INDEX `sekretaris_kelasId_key`(`kelasId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sekretaris` ADD CONSTRAINT `sekretaris_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sekretaris` ADD CONSTRAINT `sekretaris_kelasId_fkey` FOREIGN KEY (`kelasId`) REFERENCES `kelas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
