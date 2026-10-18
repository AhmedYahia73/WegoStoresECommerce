"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promise_1 = __importDefault(require("mysql2/promise"));
require("dotenv/config");
async function createDatabaseAndTables() {
    const host = process.env.DB_HOST || "127.0.0.1";
    const port = Number(process.env.DB_PORT) || 3306;
    const user = process.env.DB_USER || "root";
    const password = process.env.DB_PASSWORD || "";
    const dbName = process.env.DB_NAME || "wegostore";
    console.log(`Connecting to MySQL on ${host}:${port} as ${user}...`);
    const connection = await promise_1.default.createConnection({
        host,
        port,
        user,
        password,
    });
    // 1. Create central database if it does not exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log(`✓ Database "${dbName}" checked/created successfully.`);
    // 2. Select the database
    await connection.query(`USE \`${dbName}\`;`);
    // 3. Create central tables
    await connection.query("SET FOREIGN_KEY_CHECKS = 0;");
    // Table 1: admins
    await connection.query(`
    CREATE TABLE IF NOT EXISTS \`admins\` (
      \`id\` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
      \`name\` VARCHAR(255) NOT NULL,
      \`email\` VARCHAR(255) NOT NULL UNIQUE,
      \`password\` VARCHAR(255) NOT NULL,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
    // Table 2: packages
    await connection.query(`
    CREATE TABLE IF NOT EXISTS \`packages\` (
      \`id\` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
      \`name\` JSON NOT NULL,
      \`type\` ENUM('monthly', 'quarterly', 'biannual', 'annual') NOT NULL DEFAULT 'monthly',
      \`price\` DECIMAL(10, 2) NOT NULL,
      \`status\` BOOLEAN NOT NULL DEFAULT 1,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
    // Table 3: payment_methods
    await connection.query(`
    CREATE TABLE IF NOT EXISTS \`payment_methods\` (
      \`id\` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
      \`name\` VARCHAR(255) NOT NULL,
      \`icon\` VARCHAR(500) NOT NULL,
      \`description\` TEXT,
      \`status\` BOOLEAN NOT NULL DEFAULT 1,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
    // Table 4: discounts
    await connection.query(`
    CREATE TABLE IF NOT EXISTS \`discounts\` (
      \`id\` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
      \`name\` JSON NOT NULL,
      \`amount\` DECIMAL(10, 2) NOT NULL,
      \`type\` ENUM('percentage', 'value') NOT NULL DEFAULT 'percentage',
      \`start_date\` DATE NOT NULL,
      \`end_date\` DATE NOT NULL,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
    // Table 5: users (Tenants)
    await connection.query(`
    CREATE TABLE IF NOT EXISTS \`users\` (
      \`id\` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
      \`name\` VARCHAR(255) NOT NULL,
      \`email\` VARCHAR(255) NOT NULL UNIQUE,
      \`subdomain\` VARCHAR(255) NOT NULL UNIQUE,
      \`phone\` VARCHAR(50) NOT NULL UNIQUE,
      \`password\` VARCHAR(255) NOT NULL,
      \`package_id\` CHAR(36),
      \`start_date\` DATE,
      \`end_date\` DATE,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT \`fk_users_package\` FOREIGN KEY (\`package_id\`) REFERENCES \`packages\` (\`id\`) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
    // Table 6: orders
    await connection.query(`
    CREATE TABLE IF NOT EXISTS \`orders\` (
      \`id\` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
      \`user_id\` CHAR(36) NOT NULL,
      \`total\` DECIMAL(10, 2) NOT NULL,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT \`fk_orders_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
    // Table 7: user_orders
    await connection.query(`
    CREATE TABLE IF NOT EXISTS \`user_orders\` (
      \`id\` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
      \`package_id\` CHAR(36) NOT NULL,
      \`discount_id\` CHAR(36),
      \`price\` DECIMAL(10, 2) NOT NULL,
      \`discount\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      \`final_price\` DECIMAL(10, 2) NOT NULL,
      \`user_id\` CHAR(36) NOT NULL,
      \`status\` ENUM('pending', 'approve', 'reject') NOT NULL DEFAULT 'pending',
      \`reject_reason\` TEXT,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT \`fk_user_orders_package\` FOREIGN KEY (\`package_id\`) REFERENCES \`packages\` (\`id\`) ON DELETE RESTRICT,
      CONSTRAINT \`fk_user_orders_discount\` FOREIGN KEY (\`discount_id\`) REFERENCES \`discounts\` (\`id\`) ON DELETE SET NULL,
      CONSTRAINT \`fk_user_orders_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
    await connection.query("SET FOREIGN_KEY_CHECKS = 1;");
    console.log(`✓ All 7 central tables verified/created successfully in "${dbName}":`);
    console.log(`  - admins`);
    console.log(`  - packages`);
    console.log(`  - payment_methods`);
    console.log(`  - discounts`);
    console.log(`  - users`);
    console.log(`  - orders`);
    console.log(`  - user_orders`);
    await connection.end();
}
createDatabaseAndTables().catch((err) => {
    console.error("❌ Fatal error setting up central database:", err);
    process.exit(1);
});
