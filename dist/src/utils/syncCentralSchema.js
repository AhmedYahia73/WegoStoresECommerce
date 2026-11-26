"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncCentralSchema = syncCentralSchema;
/**
 * Inspects INFORMATION_SCHEMA for the central database and alters existing
 * central tables (`packages`, `users`, `user_orders`) so they match the
 * latest schema definitions without losing existing data.
 */
async function syncCentralSchema(connection, dbName) {
    const [rows] = await connection.query(`
    SELECT TABLE_NAME, COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME IN ('packages', 'users', 'user_orders', 'wallet_orders', 'discounts')
    `, [dbName]);
    const tableCols = new Map();
    for (const row of rows) {
        const tableName = String(row.TABLE_NAME);
        const colName = String(row.COLUMN_NAME);
        if (!tableCols.has(tableName)) {
            tableCols.set(tableName, new Set());
        }
        tableCols.get(tableName).add(colName);
    }
    // 1. Sync `packages`
    const pkgCols = tableCols.get("packages");
    if (pkgCols) {
        if (!pkgCols.has("orders_from")) {
            await connection.query("ALTER TABLE `packages` ADD COLUMN `orders_from` INT NOT NULL DEFAULT 0;");
        }
        if (!pkgCols.has("orders_to")) {
            await connection.query("ALTER TABLE `packages` ADD COLUMN `orders_to` INT NULL;");
        }
        else {
            await connection.query("ALTER TABLE `packages` MODIFY COLUMN `orders_to` INT NULL;");
        }
        if (!pkgCols.has("sort")) {
            await connection.query("ALTER TABLE `packages` ADD COLUMN `sort` INT NOT NULL DEFAULT 0;");
        }
        if (pkgCols.has("type")) {
            await connection.query("ALTER TABLE `packages` DROP COLUMN `type`;");
        }
        if (pkgCols.has("status")) {
            await connection.query("ALTER TABLE `packages` DROP COLUMN `status`;");
        }
    }
    // 2. Sync `users`
    const userCols = tableCols.get("users");
    if (userCols) {
        if (!userCols.has("orders_from")) {
            await connection.query("ALTER TABLE `users` ADD COLUMN `orders_from` INT NOT NULL DEFAULT 0;");
        }
        if (!userCols.has("orders_to")) {
            await connection.query("ALTER TABLE `users` ADD COLUMN `orders_to` INT DEFAULT 0;");
        }
        else {
            await connection.query("ALTER TABLE `users` MODIFY COLUMN `orders_to` INT DEFAULT 0;");
        }
        if (!userCols.has("orders")) {
            await connection.query("ALTER TABLE `users` ADD COLUMN `orders` INT NOT NULL DEFAULT 0;");
        }
        if (!userCols.has("upgrade_notified")) {
            await connection.query("ALTER TABLE `users` ADD COLUMN `upgrade_notified` BOOLEAN NOT NULL DEFAULT 0;");
        }
        if (!userCols.has("wallet")) {
            await connection.query("ALTER TABLE `users` ADD COLUMN `wallet` DECIMAL(10, 2) NOT NULL DEFAULT 0.00;");
        }
    }
    // 3. Sync `user_orders`
    const uoCols = tableCols.get("user_orders");
    if (uoCols) {
        if (uoCols.has("discount_id")) {
            const [fkRows] = await connection.query(`
        SELECT CONSTRAINT_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = ?
          AND TABLE_NAME = 'user_orders'
          AND COLUMN_NAME = 'discount_id'
          AND REFERENCED_TABLE_NAME IS NOT NULL
        `, [dbName]);
            for (const fk of fkRows) {
                await connection.query(`ALTER TABLE \`user_orders\` DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\`;`);
            }
            await connection.query("ALTER TABLE `user_orders` DROP COLUMN `discount_id`;");
        }
        if (uoCols.has("discount")) {
            await connection.query("ALTER TABLE `user_orders` DROP COLUMN `discount`;");
        }
        if (uoCols.has("final_price")) {
            await connection.query("ALTER TABLE `user_orders` DROP COLUMN `final_price`;");
        }
        if (!uoCols.has("receipt")) {
            await connection.query("ALTER TABLE `user_orders` ADD COLUMN `receipt` VARCHAR(500) NULL;");
        }
        if (!uoCols.has("transaction_id")) {
            await connection.query("ALTER TABLE `user_orders` ADD COLUMN `transaction_id` VARCHAR(255) NULL;");
        }
        await connection.query("ALTER TABLE `user_orders` MODIFY COLUMN `status` ENUM('pending', 'approve', 'reject', 'faild') NOT NULL DEFAULT 'pending';");
    }
    // 4. Sync `wallet_orders`
    const woCols = tableCols.get("wallet_orders");
    if (woCols) {
        if (!woCols.has("transaction_id")) {
            await connection.query("ALTER TABLE `wallet_orders` ADD COLUMN `transaction_id` VARCHAR(255) NULL;");
        }
        await connection.query("ALTER TABLE `wallet_orders` MODIFY COLUMN `status` ENUM('pending', 'approve', 'reject', 'faild') NOT NULL DEFAULT 'pending';");
    }
    // 5. Drop obsolete central `discounts` table if present
    if (tableCols.has("discounts")) {
        await connection.query("DROP TABLE IF EXISTS `discounts`;");
    }
}
