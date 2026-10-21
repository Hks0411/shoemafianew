-- AlterTable
ALTER TABLE `Customer` ADD COLUMN `addressLine` TEXT NULL,
    ADD COLUMN `city` VARCHAR(191) NULL,
    ADD COLUMN `state` VARCHAR(191) NULL,
    ADD COLUMN `pincode` VARCHAR(191) NULL,
    ADD COLUMN `addressLocked` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `name` VARCHAR(191) NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE `CustomerOtp` (
    `id` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `codeHash` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CustomerOtp_phone_expiresAt_idx`(`phone`, `expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
