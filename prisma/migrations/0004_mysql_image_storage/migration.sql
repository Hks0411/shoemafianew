-- CreateTable
CREATE TABLE `StoredImage` (
    `id` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `data` LONGBLOB NOT NULL,
    `width` INTEGER NULL,
    `height` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `ProductImage` ADD COLUMN `storedImageId` VARCHAR(191) NULL,
    MODIFY `publicId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Banner` ADD COLUMN `storedImageId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `ProductImage_storedImageId_key` ON `ProductImage`(`storedImageId`);

-- CreateIndex
CREATE UNIQUE INDEX `Banner_storedImageId_key` ON `Banner`(`storedImageId`);

-- AddForeignKey
ALTER TABLE `ProductImage` ADD CONSTRAINT `ProductImage_storedImageId_fkey` FOREIGN KEY (`storedImageId`) REFERENCES `StoredImage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Banner` ADD CONSTRAINT `Banner_storedImageId_fkey` FOREIGN KEY (`storedImageId`) REFERENCES `StoredImage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
