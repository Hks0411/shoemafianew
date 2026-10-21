ALTER TABLE `AdminUser` ADD COLUMN `username` VARCHAR(191) NOT NULL DEFAULT 'admin';

UPDATE `AdminUser` SET `username` = CONCAT('admin-', `id`) WHERE `username` = 'admin';

CREATE UNIQUE INDEX `AdminUser_username_key` ON `AdminUser`(`username`);
