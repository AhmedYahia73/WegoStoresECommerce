import { pool } from "../models/db";

export interface TableColumnDef {
  name: string;
  definition: string;
}

export interface TableDef {
  name: string;
  createSql: (db: string) => string;
  columns: TableColumnDef[];
}

/**
 * Canonical Table Definitions for All 21 Tenant Tables.
 * This is the SINGLE SOURCE OF TRUTH for both:
 * 1. createTenantSchema (for new tenants)
 * 2. migrateTenantSchema / db:migrate:tenants (for existing tenants)
 */
export const TENANT_TABLE_DEFINITIONS: TableDef[] = [
  // 1. Languages (lang)
  {
    name: "lang",
    columns: [
      { name: "id", definition: "CHAR(36) PRIMARY KEY DEFAULT (UUID())" },
      { name: "name", definition: "VARCHAR(100) NOT NULL" },
      { name: "status", definition: "BOOLEAN NOT NULL DEFAULT 1" },
      { name: "created_at", definition: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP" },
      { name: "updated_at", definition: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" },
    ],
    createSql: (db) => `
      CREATE TABLE IF NOT EXISTS \`${db}\`.\`lang\` (
        \`id\` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        \`name\` VARCHAR(100) NOT NULL,
        \`status\` BOOLEAN NOT NULL DEFAULT 1,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },

  // 2. Roles (role)
  {
    name: "role",
    columns: [
      { name: "id", definition: "CHAR(36) PRIMARY KEY DEFAULT (UUID())" },
      { name: "name", definition: "VARCHAR(255) NOT NULL" },
      { name: "created_at", definition: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP" },
      { name: "updated_at", definition: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" },
    ],
    createSql: (db) => `
      CREATE TABLE IF NOT EXISTS \`${db}\`.\`role\` (
        \`id\` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        \`name\` VARCHAR(255) NOT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },

  // 3. Permissions (perimission)
  {
    name: "perimission",
    columns: [
      { name: "id", definition: "CHAR(36) PRIMARY KEY DEFAULT (UUID())" },
      { name: "role_id", definition: "CHAR(36) NOT NULL" },
      { name: "permission", definition: "VARCHAR(255) NOT NULL" },
      { name: "actions", definition: "JSON NOT NULL" },
      { name: "created_at", definition: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP" },
      { name: "updated_at", definition: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" },
    ],
    createSql: (db) => `
      CREATE TABLE IF NOT EXISTS \`${db}\`.\`perimission\` (
        \`id\` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        \`role_id\` CHAR(36) NOT NULL,
        \`permission\` VARCHAR(255) NOT NULL,
        \`actions\` JSON NOT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT \`fk_permission_role_${db}\` FOREIGN KEY (\`role_id\`) REFERENCES \`${db}\`.\`role\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },

  // 4. Admins (admin)
  {
    name: "admin",
    columns: [
      { name: "id", definition: "CHAR(36) PRIMARY KEY DEFAULT (UUID())" },
      { name: "name", definition: "VARCHAR(255) NOT NULL" },
      { name: "email", definition: "VARCHAR(255) NOT NULL UNIQUE" },
      { name: "phone", definition: "VARCHAR(50) NOT NULL UNIQUE" },
      { name: "password", definition: "VARCHAR(255) NOT NULL" },
      { name: "role_id", definition: "CHAR(36) NOT NULL" },
      { name: "status", definition: "BOOLEAN NOT NULL DEFAULT 1" },
      { name: "created_at", definition: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP" },
      { name: "updated_at", definition: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" },
    ],
    createSql: (db) => `
      CREATE TABLE IF NOT EXISTS \`${db}\`.\`admin\` (
        \`id\` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        \`name\` VARCHAR(255) NOT NULL,
        \`email\` VARCHAR(255) NOT NULL UNIQUE,
        \`phone\` VARCHAR(50) NOT NULL UNIQUE,
        \`password\` VARCHAR(255) NOT NULL,
        \`role_id\` CHAR(36) NOT NULL,
        \`status\` BOOLEAN NOT NULL DEFAULT 1,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT \`fk_admin_role_${db}\` FOREIGN KEY (\`role_id\`) REFERENCES \`${db}\`.\`role\` (\`id\`) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },

  // 5. Staff (staff)
  {
    name: "staff",
    columns: [
      { name: "id", definition: "CHAR(36) PRIMARY KEY DEFAULT (UUID())" },
      { name: "name", definition: "VARCHAR(255) NOT NULL" },
      { name: "email", definition: "VARCHAR(255) NOT NULL UNIQUE" },
      { name: "phone", definition: "VARCHAR(50) NOT NULL UNIQUE" },
      { name: "password", definition: "VARCHAR(255) NOT NULL" },
      { name: "role_id", definition: "CHAR(36) NOT NULL" },
      { name: "created_at", definition: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP" },
      { name: "updated_at", definition: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" },
    ],
    createSql: (db) => `
      CREATE TABLE IF NOT EXISTS \`${db}\`.\`staff\` (
        \`id\` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        \`name\` VARCHAR(255) NOT NULL,
        \`email\` VARCHAR(255) NOT NULL UNIQUE,
        \`phone\` VARCHAR(50) NOT NULL UNIQUE,
        \`password\` VARCHAR(255) NOT NULL,
        \`role_id\` CHAR(36) NOT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT \`fk_staff_role_${db}\` FOREIGN KEY (\`role_id\`) REFERENCES \`${db}\`.\`role\` (\`id\`) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },

  // 5. Customers (customer)
  {
    name: "customer",
    columns: [
      { name: "id", definition: "CHAR(36) PRIMARY KEY DEFAULT (UUID())" },
      { name: "name", definition: "VARCHAR(255) NOT NULL" },
      { name: "phone", definition: "VARCHAR(50) NOT NULL UNIQUE" },
      { name: "email", definition: "VARCHAR(255) NOT NULL UNIQUE" },
      { name: "order_num", definition: "INT NOT NULL DEFAULT 0" },
      { name: "order_sum", definition: "INT NOT NULL DEFAULT 0" },
      { name: "image", definition: "VARCHAR(500) NULL" },
      { name: "password", definition: "VARCHAR(255) NOT NULL" },
      { name: "created_at", definition: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP" },
      { name: "updated_at", definition: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" },
    ],
    createSql: (db) => `
      CREATE TABLE IF NOT EXISTS \`${db}\`.\`customer\` (
        \`id\` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        \`name\` VARCHAR(255) NOT NULL,
        \`phone\` VARCHAR(50) NOT NULL UNIQUE,
        \`email\` VARCHAR(255) NOT NULL UNIQUE,
        \`order_num\` INT NOT NULL DEFAULT 0,
        \`order_sum\` INT NOT NULL DEFAULT 0,
        \`image\` VARCHAR(500) NULL,
        \`password\` VARCHAR(255) NOT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },

  // 6. Cities (city)
  {
    name: "city",
    columns: [
      { name: "id", definition: "CHAR(36) PRIMARY KEY DEFAULT (UUID())" },
      { name: "name", definition: "JSON NOT NULL" },
      { name: "status", definition: "BOOLEAN NOT NULL DEFAULT 1" },
      { name: "created_at", definition: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP" },
      { name: "updated_at", definition: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" },
    ],
    createSql: (db) => `
      CREATE TABLE IF NOT EXISTS \`${db}\`.\`city\` (
        \`id\` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        \`name\` JSON NOT NULL,
        \`status\` BOOLEAN NOT NULL DEFAULT 1,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },

  // 7. Zones (zone)
  {
    name: "zone",
    columns: [
      { name: "id", definition: "CHAR(36) PRIMARY KEY DEFAULT (UUID())" },
      { name: "name", definition: "JSON NOT NULL" },
      { name: "city_id", definition: "CHAR(36) NOT NULL" },
      { name: "status", definition: "BOOLEAN NOT NULL DEFAULT 1" },
      { name: "created_at", definition: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP" },
      { name: "updated_at", definition: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" },
    ],
    createSql: (db) => `
      CREATE TABLE IF NOT EXISTS \`${db}\`.\`zone\` (
        \`id\` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        \`name\` JSON NOT NULL,
        \`city_id\` CHAR(36) NOT NULL,
        \`status\` BOOLEAN NOT NULL DEFAULT 1,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT \`fk_zone_city_${db}\` FOREIGN KEY (\`city_id\`) REFERENCES \`${db}\`.\`city\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },

  // 8. Addresses (address)
  {
    name: "address",
    columns: [
      { name: "id", definition: "CHAR(36) PRIMARY KEY DEFAULT (UUID())" },
      { name: "customer_id", definition: "CHAR(36) NOT NULL" },
      { name: "city_id", definition: "CHAR(36) NOT NULL" },
      { name: "zone_id", definition: "CHAR(36) NOT NULL" },
      { name: "building_num", definition: "VARCHAR(50) NULL" },
      { name: "floor", definition: "VARCHAR(50) NULL" },
      { name: "address", definition: "TEXT NOT NULL" },
      { name: "street", definition: "VARCHAR(255) NULL" },
      { name: "additional_data", definition: "TEXT NULL" },
      { name: "lat", definition: "DECIMAL(10, 8) NULL" },
      { name: "lng", definition: "DECIMAL(11, 8) NULL" },
      { name: "created_at", definition: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP" },
      { name: "updated_at", definition: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" },
    ],
    createSql: (db) => `
      CREATE TABLE IF NOT EXISTS \`${db}\`.\`address\` (
        \`id\` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        \`customer_id\` CHAR(36) NOT NULL,
        \`city_id\` CHAR(36) NOT NULL,
        \`zone_id\` CHAR(36) NOT NULL,
        \`building_num\` VARCHAR(50) NULL,
        \`floor\` VARCHAR(50) NULL,
        \`address\` TEXT NOT NULL,
        \`street\` VARCHAR(255) NULL,
        \`additional_data\` TEXT NULL,
        \`lat\` DECIMAL(10, 8) NULL,
        \`lng\` DECIMAL(11, 8) NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT \`fk_address_customer_${db}\` FOREIGN KEY (\`customer_id\`) REFERENCES \`${db}\`.\`customer\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`fk_address_city_${db}\` FOREIGN KEY (\`city_id\`) REFERENCES \`${db}\`.\`city\` (\`id\`) ON DELETE RESTRICT,
        CONSTRAINT \`fk_address_zone_${db}\` FOREIGN KEY (\`zone_id\`) REFERENCES \`${db}\`.\`zone\` (\`id\`) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },

  // 9. Categories (category)
  {
    name: "category",
    columns: [
      { name: "id", definition: "CHAR(36) PRIMARY KEY DEFAULT (UUID())" },
      { name: "name", definition: "JSON NOT NULL" },
      { name: "category_id", definition: "CHAR(36) NULL" },
      { name: "order_number", definition: "INT NOT NULL DEFAULT 0" },
      { name: "banner", definition: "VARCHAR(500) NULL" },
      { name: "icon", definition: "VARCHAR(500) NULL" },
      { name: "cover_image", definition: "VARCHAR(500) NULL" },
      { name: "created_at", definition: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP" },
      { name: "updated_at", definition: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" },
    ],
    createSql: (db) => `
      CREATE TABLE IF NOT EXISTS \`${db}\`.\`category\` (
        \`id\` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        \`name\` JSON NOT NULL,
        \`category_id\` CHAR(36) NULL,
        \`order_number\` INT NOT NULL DEFAULT 0,
        \`banner\` VARCHAR(500) NULL,
        \`icon\` VARCHAR(500) NULL,
        \`cover_image\` VARCHAR(500) NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT \`fk_category_parent_${db}\` FOREIGN KEY (\`category_id\`) REFERENCES \`${db}\`.\`category\` (\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },

  // 10. Brands (brand)
  {
    name: "brand",
    columns: [
      { name: "id", definition: "CHAR(36) PRIMARY KEY DEFAULT (UUID())" },
      { name: "name", definition: "VARCHAR(255) NOT NULL" },
      { name: "logo", definition: "VARCHAR(500) NOT NULL" },
      { name: "created_at", definition: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP" },
      { name: "updated_at", definition: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" },
    ],
    createSql: (db) => `
      CREATE TABLE IF NOT EXISTS \`${db}\`.\`brand\` (
        \`id\` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        \`name\` VARCHAR(255) NOT NULL,
        \`logo\` VARCHAR(500) NOT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },

  // 11. Discounts (discount)
  {
    name: "discount",
    columns: [
      { name: "id", definition: "CHAR(36) PRIMARY KEY DEFAULT (UUID())" },
      { name: "name", definition: "JSON NOT NULL" },
      { name: "type", definition: "ENUM('percentage', 'value') NOT NULL" },
      { name: "amount", definition: "DECIMAL(10, 2) NOT NULL" },
      { name: "status", definition: "BOOLEAN NOT NULL DEFAULT 1" },
      { name: "created_at", definition: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP" },
      { name: "updated_at", definition: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" },
    ],
    createSql: (db) => `
      CREATE TABLE IF NOT EXISTS \`${db}\`.\`discount\` (
        \`id\` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        \`name\` JSON NOT NULL,
        \`type\` ENUM('percentage', 'value') NOT NULL,
        \`amount\` DECIMAL(10, 2) NOT NULL,
        \`status\` BOOLEAN NOT NULL DEFAULT 1,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },

  // 12. Flash Discounts (flash_discount)
  {
    name: "flash_discount",
    columns: [
      { name: "id", definition: "CHAR(36) PRIMARY KEY DEFAULT (UUID())" },
      { name: "name", definition: "JSON NOT NULL" },
      { name: "type", definition: "ENUM('percentage', 'value') NOT NULL" },
      { name: "amount", definition: "DECIMAL(10, 2) NOT NULL" },
      { name: "status", definition: "BOOLEAN NOT NULL DEFAULT 1" },
      { name: "start_date", definition: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP" },
      { name: "end_date", definition: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP" },
      { name: "created_at", definition: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP" },
      { name: "updated_at", definition: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" },
    ],
    createSql: (db) => `
      CREATE TABLE IF NOT EXISTS \`${db}\`.\`flash_discount\` (
        \`id\` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        \`name\` JSON NOT NULL,
        \`type\` ENUM('percentage', 'value') NOT NULL,
        \`amount\` DECIMAL(10, 2) NOT NULL,
        \`status\` BOOLEAN NOT NULL DEFAULT 1,
        \`start_date\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`end_date\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },

  // 13. Popups (popup)
  {
    name: "popup",
    columns: [
      { name: "id", definition: "CHAR(36) PRIMARY KEY DEFAULT (UUID())" },
      { name: "image", definition: "JSON NOT NULL" },
      { name: "link", definition: "VARCHAR(500) NULL" },
      { name: "name", definition: "JSON NOT NULL" },
      { name: "description", definition: "JSON NULL" },
      { name: "created_at", definition: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP" },
      { name: "updated_at", definition: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" },
    ],
    createSql: (db) => `
      CREATE TABLE IF NOT EXISTS \`${db}\`.\`popup\` (
        \`id\` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        \`image\` JSON NOT NULL,
        \`link\` VARCHAR(500) NULL,
        \`name\` JSON NOT NULL,
        \`description\` JSON NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },

  // 14. Warranties (warranty)
  {
    name: "warranty",
    columns: [
      { name: "id", definition: "CHAR(36) PRIMARY KEY DEFAULT (UUID())" },
      { name: "text", definition: "JSON NOT NULL" },
      { name: "logo", definition: "VARCHAR(500) NULL" },
      { name: "period", definition: "VARCHAR(100) NULL" },
      { name: "created_at", definition: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP" },
      { name: "updated_at", definition: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" },
    ],
    createSql: (db) => `
      CREATE TABLE IF NOT EXISTS \`${db}\`.\`warranty\` (
        \`id\` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        \`text\` JSON NOT NULL,
        \`logo\` VARCHAR(500) NULL,
        \`period\` VARCHAR(100) NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },

  // 15. Taxes (tax)
  {
    name: "tax",
    columns: [
      { name: "id", definition: "CHAR(36) PRIMARY KEY DEFAULT (UUID())" },
      { name: "name", definition: "JSON NOT NULL" },
      { name: "amount", definition: "DECIMAL(10, 2) NOT NULL" },
      { name: "type", definition: "ENUM('percentage', 'value') NOT NULL" },
      { name: "status", definition: "BOOLEAN NOT NULL DEFAULT 1" },
      { name: "created_at", definition: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP" },
      { name: "updated_at", definition: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" },
    ],
    createSql: (db) => `
      CREATE TABLE IF NOT EXISTS \`${db}\`.\`tax\` (
        \`id\` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        \`name\` JSON NOT NULL,
        \`amount\` DECIMAL(10, 2) NOT NULL,
        \`type\` ENUM('percentage', 'value') NOT NULL,
        \`status\` BOOLEAN NOT NULL DEFAULT 1,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },

  // 16. Payment Methods (payment_method)
  {
    name: "payment_method",
    columns: [
      { name: "id", definition: "CHAR(36) PRIMARY KEY DEFAULT (UUID())" },
      { name: "name", definition: "JSON NOT NULL" },
      { name: "description", definition: "TEXT NULL" },
      { name: "icon", definition: "VARCHAR(500) NOT NULL" },
      { name: "status", definition: "BOOLEAN NOT NULL DEFAULT 1" },
      { name: "created_at", definition: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP" },
      { name: "updated_at", definition: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" },
    ],
    createSql: (db) => `
      CREATE TABLE IF NOT EXISTS \`${db}\`.\`payment_method\` (
        \`id\` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        \`name\` JSON NOT NULL,
        \`description\` TEXT NULL,
        \`icon\` VARCHAR(500) NOT NULL,
        \`status\` BOOLEAN NOT NULL DEFAULT 1,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },

  // 17. Attributes (attribute)
  {
    name: "attribute",
    columns: [
      { name: "id", definition: "CHAR(36) PRIMARY KEY DEFAULT (UUID())" },
      { name: "name", definition: "JSON NOT NULL" },
      { name: "created_at", definition: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP" },
      { name: "updated_at", definition: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" },
    ],
    createSql: (db) => `
      CREATE TABLE IF NOT EXISTS \`${db}\`.\`attribute\` (
        \`id\` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        \`name\` JSON NOT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },

  // 18. Values (value)
  {
    name: "value",
    columns: [
      { name: "id", definition: "CHAR(36) PRIMARY KEY DEFAULT (UUID())" },
      { name: "name", definition: "JSON NOT NULL" },
      { name: "attribute_id", definition: "CHAR(36) NOT NULL" },
      { name: "created_at", definition: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP" },
      { name: "updated_at", definition: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" },
    ],
    createSql: (db) => `
      CREATE TABLE IF NOT EXISTS \`${db}\`.\`value\` (
        \`id\` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        \`name\` JSON NOT NULL,
        \`attribute_id\` CHAR(36) NOT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT \`fk_value_attribute_${db}\` FOREIGN KEY (\`attribute_id\`) REFERENCES \`${db}\`.\`attribute\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },

  // 19. Products (products)
  {
    name: "products",
    columns: [
      { name: "id", definition: "CHAR(36) PRIMARY KEY DEFAULT (UUID())" },
      { name: "name", definition: "JSON NOT NULL" },
      { name: "description", definition: "JSON NULL" },
      { name: "category_id", definition: "CHAR(36) NOT NULL" },
      { name: "sub_category_id", definition: "CHAR(36) NULL" },
      { name: "brand_id", definition: "CHAR(36) NULL" },
      { name: "discount_id", definition: "CHAR(36) NULL" },
      { name: "flash_discount_id", definition: "CHAR(36) NULL" },
      { name: "tax_id", definition: "CHAR(36) NULL" },
      { name: "image", definition: "VARCHAR(500) NOT NULL" },
      { name: "warrantly_id", definition: "CHAR(36) NULL" },
      { name: "warrantly_note", definition: "TEXT NULL" },
      { name: "today_deal", definition: "BOOLEAN NOT NULL DEFAULT 0" },
      { name: "free_shipping", definition: "BOOLEAN NOT NULL DEFAULT 0" },
      { name: "shipping_days", definition: "INT NOT NULL DEFAULT 0" },
      { name: "gallery", definition: "JSON NULL" },
      { name: "published", definition: "BOOLEAN NOT NULL DEFAULT 1" },
      { name: "created_at", definition: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP" },
      { name: "updated_at", definition: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" },
    ],
    createSql: (db) => `
      CREATE TABLE IF NOT EXISTS \`${db}\`.\`products\` (
        \`id\` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        \`name\` JSON NOT NULL,
        \`description\` JSON NULL,
        \`category_id\` CHAR(36) NOT NULL,
        \`sub_category_id\` CHAR(36) NULL,
        \`brand_id\` CHAR(36) NULL,
        \`discount_id\` CHAR(36) NULL,
        \`flash_discount_id\` CHAR(36) NULL,
        \`tax_id\` CHAR(36) NULL,
        \`image\` VARCHAR(500) NOT NULL,
        \`warrantly_id\` CHAR(36) NULL,
        \`warrantly_note\` TEXT NULL,
        \`today_deal\` BOOLEAN NOT NULL DEFAULT 0,
        \`free_shipping\` BOOLEAN NOT NULL DEFAULT 0,
        \`shipping_days\` INT NOT NULL DEFAULT 0,
        \`gallery\` JSON NULL,
        \`published\` BOOLEAN NOT NULL DEFAULT 1,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT \`fk_product_category_${db}\` FOREIGN KEY (\`category_id\`) REFERENCES \`${db}\`.\`category\` (\`id\`) ON DELETE RESTRICT,
        CONSTRAINT \`fk_product_subcategory_${db}\` FOREIGN KEY (\`sub_category_id\`) REFERENCES \`${db}\`.\`category\` (\`id\`) ON DELETE SET NULL,
        CONSTRAINT \`fk_product_brand_${db}\` FOREIGN KEY (\`brand_id\`) REFERENCES \`${db}\`.\`brand\` (\`id\`) ON DELETE SET NULL,
        CONSTRAINT \`fk_product_discount_${db}\` FOREIGN KEY (\`discount_id\`) REFERENCES \`${db}\`.\`discount\` (\`id\`) ON DELETE SET NULL,
        CONSTRAINT \`fk_product_flash_discount_${db}\` FOREIGN KEY (\`flash_discount_id\`) REFERENCES \`${db}\`.\`flash_discount\` (\`id\`) ON DELETE SET NULL,
        CONSTRAINT \`fk_product_tax_${db}\` FOREIGN KEY (\`tax_id\`) REFERENCES \`${db}\`.\`tax\` (\`id\`) ON DELETE SET NULL,
        CONSTRAINT \`fk_product_warranty_${db}\` FOREIGN KEY (\`warrantly_id\`) REFERENCES \`${db}\`.\`warranty\` (\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },

  // 20. Product Attributes (product_attribute)
  {
    name: "product_attribute",
    columns: [
      { name: "id", definition: "CHAR(36) PRIMARY KEY DEFAULT (UUID())" },
      { name: "product_id", definition: "CHAR(36) NOT NULL" },
      { name: "attribute_id", definition: "CHAR(36) NOT NULL" },
      { name: "created_at", definition: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP" },
      { name: "updated_at", definition: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" },
    ],
    createSql: (db) => `
      CREATE TABLE IF NOT EXISTS \`${db}\`.\`product_attribute\` (
        \`id\` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        \`product_id\` CHAR(36) NOT NULL,
        \`attribute_id\` CHAR(36) NOT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT \`fk_pa_product_${db}\` FOREIGN KEY (\`product_id\`) REFERENCES \`${db}\`.\`products\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`fk_pa_attribute_${db}\` FOREIGN KEY (\`attribute_id\`) REFERENCES \`${db}\`.\`attribute\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },

  // 21. Product Values / Variants (product_values)
  {
    name: "product_values",
    columns: [
      { name: "id", definition: "CHAR(36) PRIMARY KEY DEFAULT (UUID())" },
      { name: "product_id", definition: "CHAR(36) NOT NULL" },
      { name: "value_ids", definition: "JSON NOT NULL" },
      { name: "sku", definition: "VARCHAR(100) NULL" },
      { name: "quantity", definition: "INT NOT NULL DEFAULT 1" },
      { name: "image", definition: "VARCHAR(500) NULL" },
      { name: "price", definition: "DECIMAL(10, 2) NOT NULL DEFAULT '0.00'" },
      { name: "created_at", definition: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP" },
      { name: "updated_at", definition: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" },
    ],
    createSql: (db) => `
      CREATE TABLE IF NOT EXISTS \`${db}\`.\`product_values\` (
        \`id\` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        \`product_id\` CHAR(36) NOT NULL,
        \`value_ids\` JSON NOT NULL,
        \`sku\` VARCHAR(100) NULL,
        \`quantity\` INT NOT NULL DEFAULT 1,
        \`image\` VARCHAR(500) NULL,
        \`price\` DECIMAL(10, 2) NOT NULL DEFAULT '0.00',
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT \`fk_pv_product_${db}\` FOREIGN KEY (\`product_id\`) REFERENCES \`${db}\`.\`products\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },

  // 22. Gedia (gedia)
  {
    name: "gedia",
    columns: [
      { name: "id", definition: "CHAR(36) PRIMARY KEY DEFAULT (UUID())" },
      { name: "name", definition: "JSON NOT NULL" },
      { name: "logo", definition: "VARCHAR(500) NOT NULL" },
      { name: "public_key", definition: "TEXT NOT NULL" },
      { name: "api_password", definition: "TEXT NOT NULL" },
      { name: "environment", definition: "ENUM('egypt', 'saudi_arabia', 'uae') NOT NULL DEFAULT 'egypt'" },
      { name: "status", definition: "BOOLEAN NOT NULL DEFAULT 1" },
      { name: "callback_url", definition: "VARCHAR(500) DEFAULT '{subdomain}/api/gedia_callback'" },
      { name: "created_at", definition: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP" },
      { name: "updated_at", definition: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" },
    ],
    createSql: (db) => `
      CREATE TABLE IF NOT EXISTS \`${db}\`.\`gedia\` (
        \`id\` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        \`name\` JSON NOT NULL,
        \`logo\` VARCHAR(500) NOT NULL,
        \`public_key\` TEXT NOT NULL,
        \`api_password\` TEXT NOT NULL,
        \`environment\` ENUM('egypt', 'saudi_arabia', 'uae') NOT NULL DEFAULT 'egypt',
        \`status\` BOOLEAN NOT NULL DEFAULT 1,
        \`callback_url\` VARCHAR(500) DEFAULT '{subdomain}/api/gedia_callback',
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },

  // 23. Paymob (paymob)
  {
    name: "paymob",
    columns: [
      { name: "id", definition: "CHAR(36) PRIMARY KEY DEFAULT (UUID())" },
      { name: "name", definition: "JSON NOT NULL" },
      { name: "logo", definition: "VARCHAR(500) NOT NULL" },
      { name: "api_key", definition: "TEXT NOT NULL" },
      { name: "iframe_id", definition: "VARCHAR(255) NOT NULL" },
      { name: "integration_id", definition: "VARCHAR(255) NOT NULL" },
      { name: "hmac", definition: "TEXT NOT NULL" },
      { name: "type", definition: "ENUM('test', 'live') NOT NULL DEFAULT 'test'" },
      { name: "status", definition: "BOOLEAN NOT NULL DEFAULT 1" },
      { name: "callback_url", definition: "VARCHAR(500) DEFAULT '{subdomain}/api/paymob_callback'" },
      { name: "created_at", definition: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP" },
      { name: "updated_at", definition: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" },
    ],
    createSql: (db) => `
      CREATE TABLE IF NOT EXISTS \`${db}\`.\`paymob\` (
        \`id\` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        \`name\` JSON NOT NULL,
        \`logo\` VARCHAR(500) NOT NULL,
        \`api_key\` TEXT NOT NULL,
        \`iframe_id\` VARCHAR(255) NOT NULL,
        \`integration_id\` VARCHAR(255) NOT NULL,
        \`hmac\` TEXT NOT NULL,
        \`type\` ENUM('test', 'live') NOT NULL DEFAULT 'test'" },
        \`status\` BOOLEAN NOT NULL DEFAULT 1,
        \`callback_url\` VARCHAR(500) DEFAULT '{subdomain}/api/paymob_callback',
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },

  // 24. Kashier (kashier)
  {
    name: "kashier",
    columns: [
      { name: "id", definition: "CHAR(36) PRIMARY KEY DEFAULT (UUID())" },
      { name: "name", definition: "JSON NOT NULL" },
      { name: "logo", definition: "VARCHAR(500) NOT NULL" },
      { name: "api_key", definition: "TEXT NOT NULL" },
      { name: "secret_key", definition: "TEXT NOT NULL" },
      { name: "merchant_id", definition: "TEXT NOT NULL" },
      { name: "status", definition: "BOOLEAN NOT NULL DEFAULT 1" },
      { name: "callback_url", definition: "VARCHAR(500) DEFAULT '{subdomain}/api/kashier_callback'" },
      { name: "created_at", definition: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP" },
      { name: "updated_at", definition: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" },
    ],
    createSql: (db) => `
      CREATE TABLE IF NOT EXISTS \`${db}\`.\`kashier\` (
        \`id\` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        \`name\` JSON NOT NULL,
        \`logo\` VARCHAR(500) NOT NULL,
        \`api_key\` TEXT NOT NULL,
        \`secret_key\` TEXT NOT NULL,
        \`merchant_id\` TEXT NOT NULL,
        \`status\` BOOLEAN NOT NULL DEFAULT 1,
        \`callback_url\` VARCHAR(500) DEFAULT '{subdomain}/api/kashier_callback',
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },

  // 25. Fawry (fawry)
  {
    name: "fawry",
    columns: [
      { name: "id", definition: "CHAR(36) PRIMARY KEY DEFAULT (UUID())" },
      { name: "name", definition: "JSON NOT NULL" },
      { name: "logo", definition: "VARCHAR(500) NOT NULL" },
      { name: "merchant_code", definition: "TEXT NULL" },
      { name: "merchant_secret_key", definition: "TEXT NOT NULL" },
      { name: "fawry_base_url", definition: "ENUM('Staging', 'Live') NOT NULL DEFAULT 'Staging'" },
      { name: "status", definition: "BOOLEAN NOT NULL DEFAULT 1" },
      { name: "callback_url", definition: "VARCHAR(500) DEFAULT '{subdomain}/api/fawry_callback'" },
      { name: "created_at", definition: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP" },
      { name: "updated_at", definition: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" },
    ],
    createSql: (db) => `
      CREATE TABLE IF NOT EXISTS \`${db}\`.\`fawry\` (
        \`id\` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        \`name\` JSON NOT NULL,
        \`logo\` VARCHAR(500) NOT NULL,
        \`merchant_code\` TEXT NULL,
        \`merchant_secret_key\` TEXT NOT NULL,
        \`fawry_base_url\` ENUM('Staging', 'Live') NOT NULL DEFAULT 'Staging',
        \`status\` BOOLEAN NOT NULL DEFAULT 1,
        \`callback_url\` VARCHAR(500) DEFAULT '{subdomain}/api/fawry_callback',
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },
];

/**
 * 1. Create a new MySQL tenant database/schema and generate all 21 tables inside it.
 */
export async function createTenantSchema(subdomain: string): Promise<void> {
  const connection = await pool.getConnection();

  try {
    await connection.query("SET FOREIGN_KEY_CHECKS = 0;");

    // 1. Create the tenant database / schema
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${subdomain}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );

    // 2. Switch context to the new tenant schema
    await connection.query(`USE \`${subdomain}\`;`);

    // 3. Create all tables from canonical definitions
    for (const tableDef of TENANT_TABLE_DEFINITIONS) {
      await connection.query(tableDef.createSql(subdomain));
    }

    // 4. Insert Default Initial Data
    // Default languages: Arabic (ar) and English (en)
    await connection.query(`
      INSERT INTO \`${subdomain}\`.\`lang\` (\`id\`, \`name\`, \`status\`)
      VALUES 
        (UUID(), 'ar', 1),
        (UUID(), 'en', 1);
    `);

    // Default admin role
    await connection.query(`
      INSERT INTO \`${subdomain}\`.\`role\` (\`id\`, \`name\`)
      VALUES (UUID(), 'admin');
    `);

    await connection.query("SET FOREIGN_KEY_CHECKS = 1;");
  } catch (error) {
    console.error(`Error creating schema for subdomain "${subdomain}":`, error);
    throw error;
  } finally {
    connection.release();
  }
}

export interface MigrationSummary {
  subdomain: string;
  createdTables: string[];
  addedColumns: { table: string; column: string }[];
  errors: string[];
}

/**
 * 2. Migrate a single tenant schema by comparing canonical model definitions with MySQL INFORMATION_SCHEMA.
 * - Adds missing tables (CREATE TABLE IF NOT EXISTS)
 * - Adds missing columns (ALTER TABLE ... ADD COLUMN ...)
 * - Never deletes existing tables or columns to preserve live tenant data
 */
export async function migrateTenantSchema(subdomain: string): Promise<MigrationSummary> {
  const connection = await pool.getConnection();
  const summary: MigrationSummary = {
    subdomain,
    createdTables: [],
    addedColumns: [],
    errors: [],
  };

  try {
    await connection.query("SET FOREIGN_KEY_CHECKS = 0;");

    // Ensure database exists
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${subdomain}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );

    // Fetch existing tables for this tenant schema
    const [tableRows] = (await connection.query(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?;",
      [subdomain]
    )) as any[];

    const existingTables = new Set<string>(
      Array.isArray(tableRows) ? tableRows.map((r: any) => r.TABLE_NAME || r.table_name) : []
    );

    // Fetch existing columns for this tenant schema
    const [columnRows] = (await connection.query(
      "SELECT TABLE_NAME, COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ?;",
      [subdomain]
    )) as any[];

    const existingColumnsByTable = new Map<string, Set<string>>();
    if (Array.isArray(columnRows)) {
      for (const col of columnRows) {
        const tbl = col.TABLE_NAME || col.table_name;
        const colName = col.COLUMN_NAME || col.column_name;
        if (!existingColumnsByTable.has(tbl)) {
          existingColumnsByTable.set(tbl, new Set<string>());
        }
        existingColumnsByTable.get(tbl)!.add(colName);
      }
    }

    // Compare each canonical table
    for (const tableDef of TENANT_TABLE_DEFINITIONS) {
      if (!existingTables.has(tableDef.name)) {
        // Table doesn't exist: create it
        try {
          await connection.query(tableDef.createSql(subdomain));
          summary.createdTables.push(tableDef.name);
        } catch (err: any) {
          summary.errors.push(`Error creating table ${tableDef.name}: ${err.message}`);
        }
      } else {
        // Table exists: check for missing columns
        const tableCols = existingColumnsByTable.get(tableDef.name) || new Set<string>();
        for (const colDef of tableDef.columns) {
          if (!tableCols.has(colDef.name)) {
            try {
              await connection.query(
                `ALTER TABLE \`${subdomain}\`.\`${tableDef.name}\` ADD COLUMN \`${colDef.name}\` ${colDef.definition};`
              );
              summary.addedColumns.push({ table: tableDef.name, column: colDef.name });
            } catch (err: any) {
              summary.errors.push(
                `Error adding column ${tableDef.name}.${colDef.name}: ${err.message}`
              );
            }
          }
        }
      }
    }

    // Ensure default initial seeds exist if table was newly created
    const [langCountRows] = (await connection.query(
      `SELECT COUNT(*) as count FROM \`${subdomain}\`.\`lang\`;`
    )) as any[];
    if (Array.isArray(langCountRows) && Number(langCountRows[0]?.count) === 0) {
      await connection.query(`
        INSERT INTO \`${subdomain}\`.\`lang\` (\`id\`, \`name\`, \`status\`)
        VALUES (UUID(), 'ar', 1), (UUID(), 'en', 1);
      `);
    }

    const [roleCountRows] = (await connection.query(
      `SELECT COUNT(*) as count FROM \`${subdomain}\`.\`role\`;`
    )) as any[];
    if (Array.isArray(roleCountRows) && Number(roleCountRows[0]?.count) === 0) {
      await connection.query(`
        INSERT INTO \`${subdomain}\`.\`role\` (\`id\`, \`name\`)
        VALUES (UUID(), 'admin');
      `);
    }

    await connection.query("SET FOREIGN_KEY_CHECKS = 1;");
  } catch (error: any) {
    summary.errors.push(error.message);
  } finally {
    connection.release();
  }

  return summary;
}

/**
 * 3. Migrate ALL tenants registered in the central `users` table.
 */
export async function migrateAllTenants(): Promise<MigrationSummary[]> {
  const connection = await pool.getConnection();
  const summaries: MigrationSummary[] = [];

  try {
    let users: any[] = [];
    try {
      const [rows] = (await connection.query(
        "SELECT subdomain FROM users WHERE subdomain IS NOT NULL;"
      )) as any[];
      users = rows;
    } catch (err: any) {
      if (err.code === "ER_NO_SUCH_TABLE" || err.errno === 1146) {
        console.error(`\n❌ Error: Table 'users' does not exist in central database.`);
        console.error(`   👉 Reasons & Fixes:`);
        console.error(`   1. Central database tables have not been created yet.`);
        console.error(`      Run "npm run migrate-db" to create the central tables (users, packages, etc.).`);
        console.error(`   2. Check DB_NAME in your .env file to ensure it points to the correct database.\n`);
        return [];
      }
      throw err;
    }

    if (!Array.isArray(users) || users.length === 0) {
      console.log("No tenant users found in central database.");
      return [];
    }

    console.log(`Found ${users.length} tenant(s) to inspect & migrate...\n`);

    for (const u of users) {
      const subdomain = u.subdomain;
      console.log(`-> Migrating tenant: "${subdomain}"...`);
      const summary = await migrateTenantSchema(subdomain);
      summaries.push(summary);

      if (summary.createdTables.length > 0) {
        console.log(`   + Created tables: ${summary.createdTables.join(", ")}`);
      }
      if (summary.addedColumns.length > 0) {
        console.log(
          `   + Added columns: ${summary.addedColumns
            .map((c) => `${c.table}.${c.column}`)
            .join(", ")}`
        );
      }
      if (summary.createdTables.length === 0 && summary.addedColumns.length === 0) {
        console.log(`   ✓ Schema is fully up to date.`);
      }
      if (summary.errors.length > 0) {
        console.error(`   ✗ Errors: ${summary.errors.join("; ")}`);
      }
    }
  } finally {
    connection.release();
  }

  return summaries;
}

/**
 * 4. Rename tenant schema in MySQL by creating new database, moving tables, and dropping old database.
 */
export async function renameTenantSchema(
  oldSubdomain: string,
  newSubdomain: string
): Promise<void> {
  const connection = await pool.getConnection();

  try {
    await connection.query("SET FOREIGN_KEY_CHECKS = 0;");

    // 1. Create the new schema
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${newSubdomain}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );

    // 2. Fetch all tables from the old schema
    const [rows] = (await connection.query(`SHOW TABLES FROM \`${oldSubdomain}\`;`)) as any[];

    if (Array.isArray(rows) && rows.length > 0) {
      for (const row of rows) {
        const tableName = Object.values(row)[0] as string;
        await connection.query(
          `RENAME TABLE \`${oldSubdomain}\`.\`${tableName}\` TO \`${newSubdomain}\`.\`${tableName}\`;`
        );
      }
    }

    // 3. Drop old schema
    await connection.query(`DROP DATABASE IF EXISTS \`${oldSubdomain}\`;`);

    await connection.query("SET FOREIGN_KEY_CHECKS = 1;");
  } catch (error) {
    console.error(`Error renaming schema from "${oldSubdomain}" to "${newSubdomain}":`, error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * 5. Delete tenant database/schema when a tenant user is removed.
 */
export async function deleteTenantSchema(subdomain: string): Promise<void> {
  const connection = await pool.getConnection();

  try {
    await connection.query(`DROP DATABASE IF EXISTS \`${subdomain}\`;`);
  } catch (error) {
    console.error(`Error deleting schema for subdomain "${subdomain}":`, error);
    throw error;
  } finally {
    connection.release();
  }
}
