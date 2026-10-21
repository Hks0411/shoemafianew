-- CreateTable
CREATE TABLE `AdminUser` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AdminUser_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Customer` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Customer_phone_key`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Category` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Category_name_key`(`name`),
    UNIQUE INDEX `Category_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Product` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `itemCode` VARCHAR(191) NULL,
    `status` ENUM('DRAFT', 'ACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `categoryId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Product_slug_key`(`slug`),
    INDEX `Product_name_idx`(`name`),
    INDEX `Product_itemCode_idx`(`itemCode`),
    INDEX `Product_status_createdAt_idx`(`status`, `createdAt`),
    INDEX `Product_featured_status_idx`(`featured`, `status`),
    INDEX `Product_categoryId_idx`(`categoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ProductVariation` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `size` VARCHAR(191) NOT NULL,
    `sku` VARCHAR(191) NULL,
    `barcode` VARCHAR(191) NULL,
    `price` DECIMAL(12, 2) NOT NULL,
    `salePrice` DECIMAL(12, 2) NULL,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `reserved` INTEGER NOT NULL DEFAULT 0,
    `available` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ProductVariation_barcode_idx`(`barcode`),
    INDEX `ProductVariation_sku_idx`(`sku`),
    INDEX `ProductVariation_available_idx`(`available`),
    UNIQUE INDEX `ProductVariation_productId_size_key`(`productId`, `size`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ProductImage` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `publicId` VARCHAR(191) NOT NULL,
    `url` VARCHAR(1024) NOT NULL,
    `alt` VARCHAR(191) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `width` INTEGER NULL,
    `height` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ProductImage_productId_sortOrder_idx`(`productId`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `InventoryMovement` (
    `id` VARCHAR(191) NOT NULL,
    `variationId` VARCHAR(191) NOT NULL,
    `delta` INTEGER NOT NULL,
    `reason` ENUM('IMPORT', 'MANUAL', 'ORDER_RESERVE', 'ORDER_RELEASE', 'ORDER_FULFILL', 'RETURN', 'ADJUSTMENT') NOT NULL,
    `note` VARCHAR(191) NULL,
    `orderId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `InventoryMovement_variationId_createdAt_idx`(`variationId`, `createdAt`),
    INDEX `InventoryMovement_orderId_idx`(`orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Order` (
    `id` VARCHAR(191) NOT NULL,
    `orderNumber` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING_CONFIRMATION', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURNED') NOT NULL DEFAULT 'PENDING_CONFIRMATION',
    `customerId` VARCHAR(191) NULL,
    `customerName` VARCHAR(191) NOT NULL,
    `customerPhone` VARCHAR(191) NOT NULL,
    `customerEmail` VARCHAR(191) NULL,
    `addressLine` TEXT NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `state` VARCHAR(191) NOT NULL,
    `pincode` VARCHAR(191) NOT NULL,
    `subtotal` DECIMAL(12, 2) NOT NULL,
    `shippingCharge` DECIMAL(12, 2) NOT NULL,
    `discount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `total` DECIMAL(12, 2) NOT NULL,
    `notes` TEXT NULL,
    `reviewToken` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Order_orderNumber_key`(`orderNumber`),
    UNIQUE INDEX `Order_reviewToken_key`(`reviewToken`),
    INDEX `Order_customerPhone_idx`(`customerPhone`),
    INDEX `Order_customerName_idx`(`customerName`),
    INDEX `Order_status_createdAt_idx`(`status`, `createdAt`),
    INDEX `Order_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `OrderItem` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `variationId` VARCHAR(191) NULL,
    `productName` VARCHAR(191) NOT NULL,
    `size` VARCHAR(191) NOT NULL,
    `sku` VARCHAR(191) NULL,
    `barcode` VARCHAR(191) NULL,
    `imageUrl` VARCHAR(1024) NULL,
    `quantity` INTEGER NOT NULL,
    `unitPrice` DECIMAL(12, 2) NOT NULL,
    `lineTotal` DECIMAL(12, 2) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Payment` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `method` ENUM('COD', 'RAZORPAY') NOT NULL,
    `status` ENUM('UNPAID', 'PENDING', 'PAID', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'UNPAID',
    `amount` DECIMAL(12, 2) NOT NULL,
    `razorpayOrderId` VARCHAR(191) NULL,
    `razorpayPaymentId` VARCHAR(191) NULL,
    `razorpaySignature` VARCHAR(191) NULL,
    `rawPayload` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Payment_razorpayOrderId_idx`(`razorpayOrderId`),
    INDEX `Payment_razorpayPaymentId_idx`(`razorpayPaymentId`),
    INDEX `Payment_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `WebhookEvent` (
    `id` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `eventType` VARCHAR(191) NOT NULL,
    `processed` BOOLEAN NOT NULL DEFAULT false,
    `payload` LONGTEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `WebhookEvent_eventId_key`(`eventId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Review` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NULL,
    `customerId` VARCHAR(191) NULL,
    `orderId` VARCHAR(191) NULL,
    `authorName` VARCHAR(191) NOT NULL,
    `rating` INTEGER NOT NULL,
    `body` TEXT NOT NULL,
    `verified` BOOLEAN NOT NULL DEFAULT false,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Testimonial` (
    `id` VARCHAR(191) NOT NULL,
    `authorName` VARCHAR(191) NOT NULL,
    `rating` INTEGER NOT NULL DEFAULT 5,
    `body` TEXT NOT NULL,
    `published` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Banner` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `subtitle` VARCHAR(191) NULL,
    `imageUrl` VARCHAR(1024) NOT NULL,
    `publicId` VARCHAR(191) NULL,
    `href` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `StoreSetting` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'store',
    `data` LONGTEXT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ImportJob` (
    `id` VARCHAR(191) NOT NULL,
    `filename` VARCHAR(191) NOT NULL,
    `storagePath` VARCHAR(191) NOT NULL,
    `status` ENUM('UPLOADED', 'MAPPED', 'QUEUED', 'RUNNING', 'PAUSED', 'COMPLETED', 'FAILED', 'CANCELLED') NOT NULL DEFAULT 'UPLOADED',
    `mode` ENUM('CREATE_ONLY', 'UPDATE_MATCHING', 'UPSERT') NOT NULL DEFAULT 'UPSERT',
    `mappingJson` TEXT NULL,
    `headersJson` TEXT NULL,
    `totalRows` INTEGER NOT NULL DEFAULT 0,
    `processedRows` INTEGER NOT NULL DEFAULT 0,
    `successCount` INTEGER NOT NULL DEFAULT 0,
    `skippedCount` INTEGER NOT NULL DEFAULT 0,
    `errorCount` INTEGER NOT NULL DEFAULT 0,
    `lastProcessedRow` INTEGER NOT NULL DEFAULT 0,
    `message` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ImportError` (
    `id` VARCHAR(191) NOT NULL,
    `jobId` VARCHAR(191) NOT NULL,
    `rowNumber` INTEGER NOT NULL,
    `rawJson` TEXT NOT NULL,
    `message` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ImportError_jobId_idx`(`jobId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `adminId` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `entity` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NULL,
    `detail` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_createdAt_idx`(`createdAt`),
    INDEX `AuditLog_entity_entityId_idx`(`entity`, `entityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Product` ADD CONSTRAINT `Product_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `ProductVariation` ADD CONSTRAINT `ProductVariation_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ProductImage` ADD CONSTRAINT `ProductImage_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `InventoryMovement` ADD CONSTRAINT `InventoryMovement_variationId_fkey` FOREIGN KEY (`variationId`) REFERENCES `ProductVariation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Order` ADD CONSTRAINT `Order_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_variationId_fkey` FOREIGN KEY (`variationId`) REFERENCES `ProductVariation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Review` ADD CONSTRAINT `Review_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `Review` ADD CONSTRAINT `Review_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `ImportError` ADD CONSTRAINT `ImportError_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `ImportJob`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `AdminUser`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
