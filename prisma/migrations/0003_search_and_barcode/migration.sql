DROP INDEX `ProductVariation_barcode_idx` ON `ProductVariation`;
CREATE UNIQUE INDEX `ProductVariation_barcode_key` ON `ProductVariation`(`barcode`);
