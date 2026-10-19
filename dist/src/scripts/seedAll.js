"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promise_1 = __importDefault(require("mysql2/promise"));
const bcrypt_1 = __importDefault(require("bcrypt"));
require("dotenv/config");
const tenantSchemaService_1 = require("../services/tenantSchemaService");
async function runSeed() {
    const host = process.env.DB_HOST || "127.0.0.1";
    const port = Number(process.env.DB_PORT) || 3306;
    const user = process.env.DB_USER || "root";
    const password = process.env.DB_PASSWORD || "";
    const centralDbName = process.env.DB_NAME || "wegostore";
    console.log("==================================================================");
    console.log("🌱 STARTING COMPREHENSIVE SEEDING (CENTRAL + TENANT 'ahmed')");
    console.log(`Connecting to MySQL on ${host}:${port} as ${user}...`);
    console.log("==================================================================\n");
    const connection = await promise_1.default.createConnection({
        host,
        port,
        user,
        password,
        multipleStatements: true,
    });
    try {
        const defaultHashedPassword = await bcrypt_1.default.hash("123456789", 10);
        // =========================================================================
        // PART 1: CENTRAL DATABASE (wegostore)
        // =========================================================================
        console.log(`📦 [PART 1] Seeding Central Database: \`${centralDbName}\`...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${centralDbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
        await connection.query(`USE \`${centralDbName}\`;`);
        await connection.query("SET FOREIGN_KEY_CHECKS = 0;");
        // 1.1 Central Admins
        console.log("   -> Seeding Central Admins...");
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
        await connection.query(`
      INSERT INTO \`admins\` (\`id\`, \`name\`, \`email\`, \`password\`)
      VALUES 
        (UUID(), 'Super Admin', 'admin@gmail.com', ?)
      ON DUPLICATE KEY UPDATE 
        \`name\` = 'Super Admin',
        \`password\` = ?;
    `, [defaultHashedPassword, defaultHashedPassword]);
        await connection.query(`
      INSERT INTO \`admins\` (\`id\`, \`name\`, \`email\`, \`password\`)
      VALUES 
        (UUID(), 'Operations Manager', 'ops@wegostores.com', ?),
        (UUID(), 'Technical Support', 'support@wegostores.com', ?)
      ON DUPLICATE KEY UPDATE \`password\` = VALUES(\`password\`);
    `, [defaultHashedPassword, defaultHashedPassword]);
        // 1.2 Central Packages
        console.log("   -> Seeding Central Packages...");
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
        const packageIds = {
            starter: "10000000-0000-0000-0000-000000000001",
            pro: "10000000-0000-0000-0000-000000000002",
            growth: "10000000-0000-0000-0000-000000000003",
            vip: "10000000-0000-0000-0000-000000000004",
        };
        await connection.query(`
      INSERT INTO \`packages\` (\`id\`, \`name\`, \`type\`, \`price\`, \`status\`)
      VALUES 
        (?, ?, 'monthly', 299.00, 1),
        (?, ?, 'quarterly', 799.00, 1),
        (?, ?, 'biannual', 1499.00, 1),
        (?, ?, 'annual', 2499.00, 1)
      ON DUPLICATE KEY UPDATE 
        \`name\` = VALUES(\`name\`),
        \`price\` = VALUES(\`price\`),
        \`status\` = VALUES(\`status\`);
    `, [
            packageIds.starter, JSON.stringify({ ar: "باقة المبتدئين", en: "Starter Package" }),
            packageIds.pro, JSON.stringify({ ar: "باقة التجار المحترفين", en: "Professional Package" }),
            packageIds.growth, JSON.stringify({ ar: "باقة النمو والتوسع", en: "Growth Package" }),
            packageIds.vip, JSON.stringify({ ar: "الباقة الذهبية VIP", en: "VIP Enterprise Package" }),
        ]);
        // 1.3 Central Payment Methods
        console.log("   -> Seeding Central Payment Methods...");
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
        const centralPaymentMethods = [
            ["Visa & MasterCard", "https://wegostores.com/uploads/visa.png", "الدفع الآمن عبر البطاقات البنكية الدولية والمحلية"],
            ["ميزة الوطنية (Meeza)", "https://wegostores.com/uploads/meeza.png", "بطاقات الدفع الوطنية المصرية"],
            ["فوري باي (Fawry Pay)", "https://wegostores.com/uploads/fawry.png", "الدفع عبر منافذ وشبكة فوري في مصر"],
            ["فودافون كاش ومحافظ المحمول", "https://wegostores.com/uploads/vodafone.png", "الدفع الإلكتروني الفوري عبر محافظ الهاتف الذكية"],
            ["التحويل البنكي المباشر", "https://wegostores.com/uploads/bank.png", "إيداع وتحويل بنكي مع إرفاق صورة الإيصال"],
            ["PayPal", "https://wegostores.com/uploads/paypal.png", "الدفع بالدولار والعملات الدولية عبر PayPal"],
        ];
        for (const [name, icon, desc] of centralPaymentMethods) {
            await connection.query(`
        INSERT INTO \`payment_methods\` (\`id\`, \`name\`, \`icon\`, \`description\`, \`status\`)
        VALUES (UUID(), ?, ?, ?, 1)
        ON DUPLICATE KEY UPDATE \`description\` = VALUES(\`description\`);
      `, [name, icon, desc]);
        }
        // 1.4 Central Discounts
        console.log("   -> Seeding Central Discounts...");
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
        const discountIds = {
            promo20: "20000000-0000-0000-0000-000000000001",
            bonus150: "20000000-0000-0000-0000-000000000002",
            summer30: "20000000-0000-0000-0000-000000000003",
        };
        await connection.query(`
      INSERT INTO \`discounts\` (\`id\`, \`name\`, \`amount\`, \`type\`, \`start_date\`, \`end_date\`)
      VALUES 
        (?, ?, 20.00, 'percentage', '2026-01-01', '2026-12-31'),
        (?, ?, 150.00, 'value', '2026-01-01', '2026-12-31'),
        (?, ?, 30.00, 'percentage', '2026-06-01', '2026-09-30')
      ON DUPLICATE KEY UPDATE 
        \`name\` = VALUES(\`name\`),
        \`amount\` = VALUES(\`amount\`),
        \`type\` = VALUES(\`type\`);
    `, [
            discountIds.promo20, JSON.stringify({ ar: "خصم العام الجديد 20%", en: "New Year Promo 20%" }),
            discountIds.bonus150, JSON.stringify({ ar: "كوبون ترحيبي 150 ج.م", en: "Welcome Bonus 150 EGP" }),
            discountIds.summer30, JSON.stringify({ ar: "تخفيضات الصيف 30%", en: "Summer Promo 30%" }),
        ]);
        // 1.5 Central Users (Tenants)
        console.log("   -> Seeding Central Tenants (Users)...");
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
        const userIds = {
            ahmed: "30000000-0000-0000-0000-000000000001",
            sara: "30000000-0000-0000-0000-000000000002",
            techzone: "30000000-0000-0000-0000-000000000003",
        };
        // User 1: Ahmed (Required by user!)
        await connection.query(`
      INSERT INTO \`users\` (\`id\`, \`name\`, \`email\`, \`subdomain\`, \`phone\`, \`password\`, \`package_id\`, \`start_date\`, \`end_date\`)
      VALUES (?, 'Ahmed Store', 'ahmed@gmail.com', 'ahmed', '123456789', ?, ?, '2026-01-01', '2027-01-01')
      ON DUPLICATE KEY UPDATE 
        \`name\` = 'Ahmed Store',
        \`email\` = 'ahmed@gmail.com',
        \`phone\` = '123456789',
        \`password\` = ?,
        \`package_id\` = VALUES(\`package_id\`),
        \`start_date\` = '2026-01-01',
        \`end_date\` = '2027-01-01';
    `, [userIds.ahmed, defaultHashedPassword, packageIds.vip, defaultHashedPassword]);
        // Additional mock tenants
        await connection.query(`
      INSERT INTO \`users\` (\`id\`, \`name\`, \`email\`, \`subdomain\`, \`phone\`, \`password\`, \`package_id\`, \`start_date\`, \`end_date\`)
      VALUES 
        (?, 'سارة بوتيك للأزياء', 'sara@boutique.com', 'sara', '+201098765432', ?, ?, '2026-02-01', '2026-05-01'),
        (? , 'تيك زون للأجهزة الذكية', 'info@techzone.eg', 'techzone', '+201122334455', ?, ?, '2026-03-01', '2026-09-01')
      ON DUPLICATE KEY UPDATE 
        \`password\` = VALUES(\`password\`),
        \`package_id\` = VALUES(\`package_id\`);
    `, [
            userIds.sara, defaultHashedPassword, packageIds.pro,
            userIds.techzone, defaultHashedPassword, packageIds.growth,
        ]);
        // 1.6 Central Orders & User Orders
        console.log("   -> Seeding Central Orders & User Orders...");
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
        await connection.query(`
      CREATE TABLE IF NOT EXISTS \`user_orders\` (
        \`id\` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        \`package_id\` CHAR(36) NOT NULL,
        \`discount_id\` CHAR(36),
        \`price\` DECIMAL(10, 2) NOT NULL,
        \`discount\` DECIMAL(10, 2) NOT NULL DEFAULT '0.00',
        \`final_price\` DECIMAL(10, 2) NOT NULL,
        \`user_id\` CHAR(36) NOT NULL,
        \`status\` ENUM('pending', 'approve', 'reject') NOT NULL DEFAULT 'pending',
        \`reject_reason\` TEXT,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT \`fk_uo_package\` FOREIGN KEY (\`package_id\`) REFERENCES \`packages\` (\`id\`) ON DELETE RESTRICT,
        CONSTRAINT \`fk_uo_discount\` FOREIGN KEY (\`discount_id\`) REFERENCES \`discounts\` (\`id\`) ON DELETE SET NULL,
        CONSTRAINT \`fk_uo_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
        await connection.query(`
      INSERT INTO \`orders\` (\`id\`, \`user_id\`, \`total\`)
      VALUES 
        (UUID(), ?, 2499.00),
        (UUID(), ?, 799.00),
        (UUID(), ?, 1499.00);
    `, [userIds.ahmed, userIds.sara, userIds.techzone]);
        await connection.query(`
      INSERT INTO \`user_orders\` (\`id\`, \`package_id\`, \`discount_id\`, \`price\`, \`discount\`, \`final_price\`, \`user_id\`, \`status\`)
      VALUES 
        (UUID(), ?, NULL, 2499.00, 0.00, 2499.00, ?, 'approve'),
        (UUID(), ?, ?, 799.00, 150.00, 649.00, ?, 'approve'),
        (UUID(), ?, NULL, 1499.00, 0.00, 1499.00, ?, 'pending');
    `, [
            packageIds.vip, userIds.ahmed,
            packageIds.pro, discountIds.bonus150, userIds.sara,
            packageIds.growth, userIds.techzone,
        ]);
        await connection.query("SET FOREIGN_KEY_CHECKS = 1;");
        console.log("✅ [PART 1 COMPLETE] Central Database seeded successfully!\n");
        // =========================================================================
        // PART 2: TENANT SCHEMA (ahmed)
        // =========================================================================
        const tenantDb = "ahmed";
        console.log(`🏬 [PART 2] Seeding Tenant Schema: \`${tenantDb}\`...`);
        // 2.1 Create Schema
        try {
            await connection.query(`CREATE DATABASE IF NOT EXISTS \`${tenantDb}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
            console.log(`   ✓ Database \`${tenantDb}\` created or already exists.`);
        }
        catch (createErr) {
            console.warn(`   ⚠️ Warning: Could not run CREATE DATABASE \`${tenantDb}\` (${createErr.sqlMessage || createErr.message}).`);
            console.warn(`   Attempting to connect to \`${tenantDb}\` directly (in case it was created via Plesk / MySQL)...`);
        }
        try {
            await connection.query(`USE \`${tenantDb}\`;`);
        }
        catch (useErr) {
            console.error(`\n❌ Failed to access database \`${tenantDb}\`.`);
            console.error(`Reason: User '${user}' does not have privileges to create or use database \`${tenantDb}\`.`);
            console.error(`\n💡 To solve this on Plesk:`);
            console.error(`   Run this single command in Plesk terminal / SSH as root:`);
            console.error(`   plesk db "GRANT ALL PRIVILEGES ON *.* TO '${user}'@'localhost' WITH GRANT OPTION; GRANT ALL PRIVILEGES ON *.* TO '${user}'@'127.0.0.1' WITH GRANT OPTION; GRANT ALL PRIVILEGES ON *.* TO '${user}'@'%' WITH GRANT OPTION; FLUSH PRIVILEGES;"`);
            console.error(`   OR create database \`${tenantDb}\` in Plesk UI (Databases -> Add Database) and assign user '${user}'.\n`);
            throw useErr;
        }
        await connection.query("SET FOREIGN_KEY_CHECKS = 0;");
        // 2.2 Create All 22 Tenant Tables from canonical definitions
        console.log("   -> Ensuring all 22 tenant tables exist in schema `ahmed`...");
        for (const tableDef of tenantSchemaService_1.TENANT_TABLE_DEFINITIONS) {
            await connection.query(tableDef.createSql(tenantDb));
        }
        // 2.3 Languages (lang)
        console.log("   -> Seeding Languages...");
        const langIds = {
            ar: "40000000-0000-0000-0000-000000000001",
            en: "40000000-0000-0000-0000-000000000002",
        };
        await connection.query(`
      INSERT INTO \`${tenantDb}\`.\`lang\` (\`id\`, \`name\`, \`status\`)
      VALUES 
        (?, 'ar', 1),
        (?, 'en', 1)
      ON DUPLICATE KEY UPDATE \`status\` = 1;
    `, [langIds.ar, langIds.en]);
        // 2.4 Roles (role)
        console.log("   -> Seeding Roles...");
        const roleIds = {
            admin: "50000000-0000-0000-0000-000000000001",
            manager: "50000000-0000-0000-0000-000000000002",
            support: "50000000-0000-0000-0000-000000000003",
            delivery: "50000000-0000-0000-0000-000000000004",
        };
        await connection.query(`
      INSERT INTO \`${tenantDb}\`.\`role\` (\`id\`, \`name\`)
      VALUES 
        (?, 'admin'),
        (?, 'manager'),
        (?, 'support'),
        (?, 'delivery')
      ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`);
    `, [roleIds.admin, roleIds.manager, roleIds.support, roleIds.delivery]);
        // 2.5 Permissions (perimission)
        console.log("   -> Seeding Permissions...");
        const modules = [
            "products", "categories", "orders", "customers", "brands",
            "discounts", "staff", "settings", "reports", "taxes"
        ];
        for (const mod of modules) {
            await connection.query(`
        INSERT INTO \`${tenantDb}\`.\`perimission\` (\`id\`, \`role_id\`, \`permission\`, \`actions\`)
        VALUES 
          (UUID(), ?, ?, ?),
          (UUID(), ?, ?, ?)
        ON DUPLICATE KEY UPDATE \`actions\` = VALUES(\`actions\`);
      `, [
                roleIds.admin, mod, JSON.stringify(["create", "read", "update", "delete"]),
                roleIds.manager, mod, JSON.stringify(["create", "read", "update"]),
            ]);
        }
        // 2.6 Tenant Admin (admin table in tenant schema) - EXACT credentials requested!
        console.log("   -> Seeding Tenant Admin ('ahmed@gmail.com')...");
        await connection.query(`
      INSERT INTO \`${tenantDb}\`.\`admin\` (\`id\`, \`name\`, \`email\`, \`phone\`, \`password\`, \`role_id\`, \`status\`)
      VALUES (UUID(), 'Ahmed Mohamed (Store Owner)', 'ahmed@gmail.com', '123456789', ?, ?, 1)
      ON DUPLICATE KEY UPDATE 
        \`name\` = 'Ahmed Mohamed (Store Owner)',
        \`phone\` = '123456789',
        \`password\` = ?,
        \`role_id\` = ?,
        \`status\` = 1;
    `, [defaultHashedPassword, roleIds.admin, defaultHashedPassword, roleIds.admin]);
        // 2.7 Staff (staff)
        console.log("   -> Seeding Staff...");
        const staffMembers = [
            ["عمر فاروق - مدير المتجر", "omar.manager@ahmedstore.com", "+201011122233", roleIds.manager],
            ["نورهان علي - خدمة العملاء", "nour.support@ahmedstore.com", "+201022233344", roleIds.support],
            ["يوسف طارق - مندوب التوصيل", "youssef.delivery@ahmedstore.com", "+201033344455", roleIds.delivery],
        ];
        for (const [name, email, phone, roleId] of staffMembers) {
            await connection.query(`
        INSERT INTO \`${tenantDb}\`.\`staff\` (\`id\`, \`name\`, \`email\`, \`phone\`, \`password\`, \`role_id\`)
        VALUES (UUID(), ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE \`password\` = VALUES(\`password\`);
      `, [name, email, phone, defaultHashedPassword, roleId]);
        }
        // 2.8 Customers (customer)
        console.log("   -> Seeding 12 Customers...");
        const customersData = [
            ["محمود حسن", "+201001001001", "mahmoud.hassan@gmail.com", 5, 12500, "https://wegostores.com/uploads/user1.png"],
            ["فاطمة السيد", "+201002002002", "fatma.elsayed@yahoo.com", 3, 4200, "https://wegostores.com/uploads/user2.png"],
            ["عمرو دياب", "+201003003003", "amr.diab@gmail.com", 8, 28900, "https://wegostores.com/uploads/user3.png"],
            ["دينا سمير", "+201004004004", "dina.samir@hotmail.com", 2, 1850, "https://wegostores.com/uploads/user4.png"],
            ["كريم عبد العزيز", "+201005005005", "karim.abdelaziz@gmail.com", 6, 15300, "https://wegostores.com/uploads/user5.png"],
            ["منى زكي", "+201006006006", "mona.zaki@gmail.com", 4, 8900, "https://wegostores.com/uploads/user6.png"],
            ["تامر حسني", "+201007007007", "tamer.hosny@gmail.com", 1, 750, "https://wegostores.com/uploads/user7.png"],
            ["ياسمين صبري", "+201008008008", "yasmin.sabri@gmail.com", 9, 45000, "https://wegostores.com/uploads/user8.png"],
            ["مصطفى شعبان", "+201009009009", "mostafa.shaban@gmail.com", 0, 0, "https://wegostores.com/uploads/user9.png"],
            ["ريم ماجد", "+201010010010", "reem.maged@gmail.com", 2, 3400, "https://wegostores.com/uploads/user10.png"],
            ["هاني عادل", "+201011011011", "hany.adel@gmail.com", 7, 22100, "https://wegostores.com/uploads/user11.png"],
            ["شيرين رضا", "+201012012012", "sherine.reda@gmail.com", 3, 6700, "https://wegostores.com/uploads/user12.png"],
        ];
        const customerIds = [];
        for (const [name, phone, email, orderNum, orderSum, img] of customersData) {
            const custId = `60000000-0000-0000-0000-${String(customerIds.length + 1).padStart(12, "0")}`;
            customerIds.push(custId);
            await connection.query(`
        INSERT INTO \`${tenantDb}\`.\`customer\` (\`id\`, \`name\`, \`phone\`, \`email\`, \`order_num\`, \`order_sum\`, \`image\`, \`password\`)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          \`name\` = VALUES(\`name\`),
          \`order_num\` = VALUES(\`order_num\`),
          \`order_sum\` = VALUES(\`order_sum\`);
      `, [custId, name, phone, email, orderNum, orderSum, img, defaultHashedPassword]);
        }
        // 2.9 Cities (city)
        console.log("   -> Seeding Cities...");
        const cityIds = {
            cairo: "70000000-0000-0000-0000-000000000001",
            giza: "70000000-0000-0000-0000-000000000002",
            alex: "70000000-0000-0000-0000-000000000003",
            mansoura: "70000000-0000-0000-0000-000000000004",
        };
        await connection.query(`
      INSERT INTO \`${tenantDb}\`.\`city\` (\`id\`, \`name\`, \`status\`)
      VALUES 
        (?, ?, 1),
        (?, ?, 1),
        (?, ?, 1),
        (?, ?, 1)
      ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`);
    `, [
            cityIds.cairo, JSON.stringify({ ar: "القاهرة", en: "Cairo" }),
            cityIds.giza, JSON.stringify({ ar: "الجيزة", en: "Giza" }),
            cityIds.alex, JSON.stringify({ ar: "الإسكندرية", en: "Alexandria" }),
            cityIds.mansoura, JSON.stringify({ ar: "المنصورة", en: "Mansoura" }),
        ]);
        // 2.10 Zones (zone)
        console.log("   -> Seeding Zones...");
        const zoneIds = {
            nasrCity: "71000000-0000-0000-0000-000000000001",
            newCairo: "71000000-0000-0000-0000-000000000002",
            maadi: "71000000-0000-0000-0000-000000000003",
            heliopolis: "71000000-0000-0000-0000-000000000004",
            dokki: "71000000-0000-0000-0000-000000000005",
            sheikhZayed: "71000000-0000-0000-0000-000000000006",
            october: "71000000-0000-0000-0000-000000000007",
            smouha: "71000000-0000-0000-0000-000000000008",
            miami: "71000000-0000-0000-0000-000000000009",
        };
        const zonesData = [
            [zoneIds.nasrCity, JSON.stringify({ ar: "مدينة نصر", en: "Nasr City" }), cityIds.cairo],
            [zoneIds.newCairo, JSON.stringify({ ar: "التجمع الخامس والقاهرة الجديدة", en: "New Cairo / 5th Settlement" }), cityIds.cairo],
            [zoneIds.maadi, JSON.stringify({ ar: "المعادي", en: "Maadi" }), cityIds.cairo],
            [zoneIds.heliopolis, JSON.stringify({ ar: "مصر الجديدة", en: "Heliopolis" }), cityIds.cairo],
            [zoneIds.dokki, JSON.stringify({ ar: "الدقي والمهندسين", en: "Dokki & Mohandessin" }), cityIds.giza],
            [zoneIds.sheikhZayed, JSON.stringify({ ar: "الشيخ زايد", en: "Sheikh Zayed" }), cityIds.giza],
            [zoneIds.october, JSON.stringify({ ar: "السادس من أكتوبر", en: "6th of October" }), cityIds.giza],
            [zoneIds.smouha, JSON.stringify({ ar: "سموحة", en: "Smouha" }), cityIds.alex],
            [zoneIds.miami, JSON.stringify({ ar: "ميامي وسيدي بشر", en: "Miami & Sidi Bishr" }), cityIds.alex],
        ];
        for (const [zId, zName, cId] of zonesData) {
            await connection.query(`
        INSERT INTO \`${tenantDb}\`.\`zone\` (\`id\`, \`name\`, \`city_id\`, \`status\`)
        VALUES (?, ?, ?, 1)
        ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`);
      `, [zId, zName, cId]);
        }
        // 2.11 Customer Addresses (address)
        console.log("   -> Seeding Customer Addresses with GPS Coordinates...");
        const addressesData = [
            [customerIds[0], cityIds.cairo, zoneIds.nasrCity, "14", "3", "شارع عباس العقاد بجوار مول سيتي ستارز", "عباس العقاد", 30.0561, 31.3412],
            [customerIds[1], cityIds.cairo, zoneIds.newCairo, "25", "1", "شارع التسعين الشمالي - مجمع البنوك", "التسعين الشمالي", 30.0245, 31.4789],
            [customerIds[2], cityIds.giza, zoneIds.sheikhZayed, "8", "فيلا", "كمبوند بيفرلي هيلز - المجاورة الأولى", "بيفرلي هيلز", 30.0612, 30.9854],
            [customerIds[3], cityIds.cairo, zoneIds.maadi, "52", "4", "شارع النصر أمام كارفور المعادي", "شارع النصر", 29.9723, 31.2891],
            [customerIds[4], cityIds.giza, zoneIds.dokki, "3", "2", "شارع مصدق متفرع من محيي الدين أبو العز", "شارع مصدق", 30.0389, 31.2056],
            [customerIds[5], cityIds.alex, zoneIds.smouha, "10", "6", "شارع ألبرت الأول ميدان فيكتور عمانويل", "ألبرت الأول", 31.2156, 29.9543],
        ];
        for (const [cId, cityId, zoneId, bNum, fl, addr, str, lat, lng] of addressesData) {
            await connection.query(`
        INSERT INTO \`${tenantDb}\`.\`address\` 
          (\`id\`, \`customer_id\`, \`city_id\`, \`zone_id\`, \`building_num\`, \`floor\`, \`address\`, \`street\`, \`lat\`, \`lng\`)
        VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE \`address\` = VALUES(\`address\`);
      `, [cId, cityId, zoneId, bNum, fl, addr, str, lat, lng]);
        }
        // 2.12 Categories (category)
        console.log("   -> Seeding Categories & Subcategories...");
        const categoryIds = {
            electronics: "80000000-0000-0000-0000-000000000001",
            fashion: "80000000-0000-0000-0000-000000000002",
            home: "80000000-0000-0000-0000-000000000003",
            beauty: "80000000-0000-0000-0000-000000000004",
            // Subcategories
            smartphones: "81000000-0000-0000-0000-000000000001",
            laptops: "81000000-0000-0000-0000-000000000002",
            audio: "81000000-0000-0000-0000-000000000003",
            mensWear: "81000000-0000-0000-0000-000000000004",
            womensWear: "81000000-0000-0000-0000-000000000005",
            coffeeMakers: "81000000-0000-0000-0000-000000000006",
        };
        // Main Categories
        await connection.query(`
      INSERT INTO \`${tenantDb}\`.\`category\` (\`id\`, \`name\`, \`category_id\`, \`order_number\`, \`banner\`, \`icon\`, \`cover_image\`)
      VALUES 
        (?, ?, NULL, 1, 'https://wegostores.com/uploads/cat_electronics_banner.jpg', 'https://wegostores.com/uploads/cat_electronics_icon.png', 'https://wegostores.com/uploads/cat_electronics_cover.jpg'),
        (?, ?, NULL, 2, 'https://wegostores.com/uploads/cat_fashion_banner.jpg', 'https://wegostores.com/uploads/cat_fashion_icon.png', 'https://wegostores.com/uploads/cat_fashion_cover.jpg'),
        (?, ?, NULL, 3, 'https://wegostores.com/uploads/cat_home_banner.jpg', 'https://wegostores.com/uploads/cat_home_icon.png', 'https://wegostores.com/uploads/cat_home_cover.jpg'),
        (?, ?, NULL, 4, 'https://wegostores.com/uploads/cat_beauty_banner.jpg', 'https://wegostores.com/uploads/cat_beauty_icon.png', 'https://wegostores.com/uploads/cat_beauty_cover.jpg')
      ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`);
    `, [
            categoryIds.electronics, JSON.stringify({ ar: "الإلكترونيات والأجهزة الذكية", en: "Electronics & Smart Devices" }),
            categoryIds.fashion, JSON.stringify({ ar: "الأزياء والملابس", en: "Fashion & Clothing" }),
            categoryIds.home, JSON.stringify({ ar: "المنزل والمطبخ", en: "Home & Kitchen" }),
            categoryIds.beauty, JSON.stringify({ ar: "العناية والجمال", en: "Beauty & Personal Care" }),
        ]);
        // Sub Categories
        await connection.query(`
      INSERT INTO \`${tenantDb}\`.\`category\` (\`id\`, \`name\`, \`category_id\`, \`order_number\`, \`banner\`, \`icon\`, \`cover_image\`)
      VALUES 
        (?, ?, ?, 1, NULL, 'https://wegostores.com/uploads/cat_phones.png', NULL),
        (?, ?, ?, 2, NULL, 'https://wegostores.com/uploads/cat_laptops.png', NULL),
        (?, ?, ?, 3, NULL, 'https://wegostores.com/uploads/cat_audio.png', NULL),
        (?, ?, ?, 1, NULL, 'https://wegostores.com/uploads/cat_mens.png', NULL),
        (?, ?, ?, 2, NULL, 'https://wegostores.com/uploads/cat_womens.png', NULL),
        (?, ?, ?, 1, NULL, 'https://wegostores.com/uploads/cat_coffee.png', NULL)
      ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`);
    `, [
            categoryIds.smartphones, JSON.stringify({ ar: "الهواتف الذكية", en: "Smartphones" }), categoryIds.electronics,
            categoryIds.laptops, JSON.stringify({ ar: "أجهزة اللابتوب", en: "Laptops" }), categoryIds.electronics,
            categoryIds.audio, JSON.stringify({ ar: "السماعات والصوتيات", en: "Audio & Headphones" }), categoryIds.electronics,
            categoryIds.mensWear, JSON.stringify({ ar: "الملابس الرجالية", en: "Men's Clothing" }), categoryIds.fashion,
            categoryIds.womensWear, JSON.stringify({ ar: "الملابس النسائية", en: "Women's Clothing" }), categoryIds.fashion,
            categoryIds.coffeeMakers, JSON.stringify({ ar: "صانعات القهوة والاسبريسو", en: "Coffee & Espresso Machines" }), categoryIds.home,
        ]);
        // 2.13 Brands (brand)
        console.log("   -> Seeding Brands...");
        const brandIds = {
            apple: "82000000-0000-0000-0000-000000000001",
            samsung: "82000000-0000-0000-0000-000000000002",
            dell: "82000000-0000-0000-0000-000000000003",
            nike: "82000000-0000-0000-0000-000000000004",
            adidas: "82000000-0000-0000-0000-000000000005",
            sony: "82000000-0000-0000-0000-000000000006",
            zara: "82000000-0000-0000-0000-000000000007",
            philips: "82000000-0000-0000-0000-000000000008",
        };
        const brandsData = [
            [brandIds.apple, "Apple", "https://wegostores.com/uploads/apple_logo.png"],
            [brandIds.samsung, "Samsung", "https://wegostores.com/uploads/samsung_logo.png"],
            [brandIds.dell, "Dell", "https://wegostores.com/uploads/dell_logo.png"],
            [brandIds.nike, "Nike", "https://wegostores.com/uploads/nike_logo.png"],
            [brandIds.adidas, "Adidas", "https://wegostores.com/uploads/adidas_logo.png"],
            [brandIds.sony, "Sony", "https://wegostores.com/uploads/sony_logo.png"],
            [brandIds.zara, "Zara", "https://wegostores.com/uploads/zara_logo.png"],
            [brandIds.philips, "Philips", "https://wegostores.com/uploads/philips_logo.png"],
        ];
        for (const [bId, bName, bLogo] of brandsData) {
            await connection.query(`
        INSERT INTO \`${tenantDb}\`.\`brand\` (\`id\`, \`name\`, \`logo\`)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`), \`logo\` = VALUES(\`logo\`);
      `, [bId, bName, bLogo]);
        }
        // 2.14 Discounts & Flash Discounts
        console.log("   -> Seeding Tenant Discounts & Flash Discounts...");
        const tenantDiscountIds = {
            welcome10: "83000000-0000-0000-0000-000000000001",
            coupon100: "83000000-0000-0000-0000-000000000002",
            vip15: "83000000-0000-0000-0000-000000000003",
        };
        await connection.query(`
      INSERT INTO \`${tenantDb}\`.\`discount\` (\`id\`, \`name\`, \`type\`, \`amount\`, \`status\`)
      VALUES 
        (?, ?, 'percentage', 10.00, 1),
        (?, ?, 'value', 100.00, 1),
        (?, ?, 'percentage', 15.00, 1)
      ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`);
    `, [
            tenantDiscountIds.welcome10, JSON.stringify({ ar: "خصم أول طلب 10%", en: "10% First Order Discount" }),
            tenantDiscountIds.coupon100, JSON.stringify({ ar: "كوبون خصم 100 ج.م", en: "100 EGP Off Voucher" }),
            tenantDiscountIds.vip15, JSON.stringify({ ar: "خصم العملاء المميزين 15%", en: "15% VIP Customer Discount" }),
        ]);
        const tenantFlashIds = {
            weekend25: "83100000-0000-0000-0000-000000000001",
            midnight200: "83100000-0000-0000-0000-000000000002",
        };
        await connection.query(`
      INSERT INTO \`${tenantDb}\`.\`flash_discount\` (\`id\`, \`name\`, \`type\`, \`amount\`, \`status\`, \`start_date\`, \`end_date\`)
      VALUES 
        (?, ?, 'percentage', 25.00, 1, '2026-01-01 00:00:00', '2026-12-31 23:59:59'),
        (?, ?, 'value', 200.00, 1, '2026-01-01 00:00:00', '2026-12-31 23:59:59')
      ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`);
    `, [
            tenantFlashIds.weekend25, JSON.stringify({ ar: "عرض نهاية الأسبوع 25%", en: "Weekend Flash Sale 25%" }),
            tenantFlashIds.midnight200, JSON.stringify({ ar: "تخفيضات منتصف الليل 200 ج.م", en: "Midnight Mega Deal 200 EGP" }),
        ]);
        // 2.15 Warranties & Taxes
        console.log("   -> Seeding Warranties & Taxes...");
        const warrantyIds = {
            oneYear: "84000000-0000-0000-0000-000000000001",
            twoYears: "84000000-0000-0000-0000-000000000002",
            thirtyDays: "84000000-0000-0000-0000-000000000003",
        };
        await connection.query(`
      INSERT INTO \`${tenantDb}\`.\`warranty\` (\`id\`, \`text\`, \`logo\`, \`period\`)
      VALUES 
        (?, ?, 'https://wegostores.com/uploads/warranty_1yr.png', 'سنة واحدة (1 Year)'),
        (?, ?, 'https://wegostores.com/uploads/warranty_2yr.png', 'سنتان (2 Years)'),
        (?, ?, 'https://wegostores.com/uploads/warranty_30d.png', '30 يوماً (30 Days)')
      ON DUPLICATE KEY UPDATE \`text\` = VALUES(\`text\`);
    `, [
            warrantyIds.oneYear, JSON.stringify({ ar: "ضمان محلي معتمد لمدة عام ضد عيوب الصناعة", en: "1 Year Official Local Warranty Against Manufacturing Defects" }),
            warrantyIds.twoYears, JSON.stringify({ ar: "ضمان الوكيل المعتمد لمدة عامين مع صيانة دورية", en: "2 Years Authorized Agent Warranty with Maintenance" }),
            warrantyIds.thirtyDays, JSON.stringify({ ar: "استبدال فوري واسترجاع مجاني خلال 30 يوماً", en: "30 Days Instant Replacement and Free Returns" }),
        ]);
        const taxIds = {
            vat14: "85000000-0000-0000-0000-000000000001",
            service2: "85000000-0000-0000-0000-000000000002",
        };
        await connection.query(`
      INSERT INTO \`${tenantDb}\`.\`tax\` (\`id\`, \`name\`, \`amount\`, \`type\`, \`status\`)
      VALUES 
        (?, ?, 14.00, 'percentage', 1),
        (?, ?, 2.00, 'percentage', 1)
      ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`);
    `, [
            taxIds.vat14, JSON.stringify({ ar: "ضريبة القيمة المضافة 14%", en: "VAT 14%" }),
            taxIds.service2, JSON.stringify({ ar: "رسم خدمات المتجر 2%", en: "Store Service Fee 2%" }),
        ]);
        // 2.16 Tenant Payment Methods
        console.log("   -> Seeding Tenant Payment Methods...");
        const tenantPayments = [
            [JSON.stringify({ ar: "الدفع نقدياً عند الاستلام (كاش)", en: "Cash on Delivery (COD)" }), "https://wegostores.com/uploads/cod.png", "ادفع نقداً لمندوب الشحن عند وصول الطلب إلى باب منزلك"],
            [JSON.stringify({ ar: "الدفع بالفيزا / ماستركارد عند الاستلام (POS)", en: "Card on Delivery (POS)" }), "https://wegostores.com/uploads/pos.png", "السداد عبر ماكينة الدفع الإلكتروني المحمولة مع المندوب"],
            [JSON.stringify({ ar: "بطاقة بنكية أونلاين (Credit / Debit Card)", en: "Online Card Payment" }), "https://wegostores.com/uploads/card.png", "دفع فوري آمن ومباشر عبر بوابات الدفع الإلكترونية"],
            [JSON.stringify({ ar: "المحافظ الإلكترونية (فودافون كاش، اتصالات، أورنج)", en: "Smart Wallets" }), "https://wegostores.com/uploads/wallets.png", "التحويل السريع عبر محافظ الهواتف الذكية وتأكيد فوري"],
        ];
        for (const [pName, pIcon, pDesc] of tenantPayments) {
            await connection.query(`
        INSERT INTO \`${tenantDb}\`.\`payment_method\` (\`id\`, \`name\`, \`icon\`, \`description\`, \`status\`)
        VALUES (UUID(), ?, ?, ?, 1)
        ON DUPLICATE KEY UPDATE \`description\` = VALUES(\`description\`);
      `, [pName, pIcon, pDesc]);
        }
        // 2.17 Popups (popup)
        console.log("   -> Seeding Promotional Popups...");
        await connection.query(`
      INSERT INTO \`${tenantDb}\`.\`popup\` (\`id\`, \`name\`, \`description\`, \`image\`, \`link\`)
      VALUES 
        (
          UUID(), 
          ?, 
          ?, 
          ?, 
          '/category/electronics'
        ),
        (
          UUID(), 
          ?, 
          ?, 
          ?, 
          '/flash-deals'
        );
    `, [
            JSON.stringify({ ar: "عروض الموسم الحصرية في متجر أحمد!", en: "Seasonal Exclusive Deals at Ahmed Store!" }),
            JSON.stringify({ ar: "احصل على خصم 10% إضافي عند الدفع الإلكتروني", en: "Get an extra 10% discount on online payments" }),
            JSON.stringify({ url: "https://wegostores.com/uploads/popup_promo1.jpg" }),
            JSON.stringify({ ar: "عروض الفلاش الأسبوعية", en: "Weekly Flash Deals" }),
            JSON.stringify({ ar: "تخفيضات تصل إلى 50% على الهواتف والسماعات", en: "Up to 50% off on selected headphones & phones" }),
            JSON.stringify({ url: "https://wegostores.com/uploads/popup_promo2.jpg" }),
        ]);
        // 2.18 Attributes & Values
        console.log("   -> Seeding Attributes & Values...");
        const attributeIds = {
            color: "86000000-0000-0000-0000-000000000001",
            size: "86000000-0000-0000-0000-000000000002",
            storage: "86000000-0000-0000-0000-000000000003",
            ram: "86000000-0000-0000-0000-000000000004",
        };
        await connection.query(`
      INSERT INTO \`${tenantDb}\`.\`attribute\` (\`id\`, \`name\`)
      VALUES 
        (?, ?),
        (?, ?),
        (?, ?),
        (?, ?)
      ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`);
    `, [
            attributeIds.color, JSON.stringify({ ar: "اللون", en: "Color" }),
            attributeIds.size, JSON.stringify({ ar: "المقاس", en: "Size" }),
            attributeIds.storage, JSON.stringify({ ar: "سعة التخزين", en: "Storage Capacity" }),
            attributeIds.ram, JSON.stringify({ ar: "الذاكرة العشوائية (رام)", en: "RAM" }),
        ]);
        const valueIds = {
            // Colors
            black: "87000000-0000-0000-0000-000000000001",
            white: "87000000-0000-0000-0000-000000000002",
            blue: "87000000-0000-0000-0000-000000000003",
            silver: "87000000-0000-0000-0000-000000000004",
            gold: "87000000-0000-0000-0000-000000000005",
            // Sizes
            small: "87000000-0000-0000-0000-000000000010",
            medium: "87000000-0000-0000-0000-000000000011",
            large: "87000000-0000-0000-0000-000000000012",
            xlarge: "87000000-0000-0000-0000-000000000013",
            // Storages
            s128: "87000000-0000-0000-0000-000000000020",
            s256: "87000000-0000-0000-0000-000000000021",
            s512: "87000000-0000-0000-0000-000000000022",
            s1tb: "87000000-0000-0000-0000-000000000023",
            // RAM
            r8: "87000000-0000-0000-0000-000000000030",
            r16: "87000000-0000-0000-0000-000000000031",
            r32: "87000000-0000-0000-0000-000000000032",
        };
        const valuesData = [
            // Colors
            [valueIds.black, JSON.stringify({ ar: "أسود تيتانيوم", en: "Titanium Black" }), attributeIds.color],
            [valueIds.white, JSON.stringify({ ar: "أبيض تيتانيوم", en: "Titanium White" }), attributeIds.color],
            [valueIds.blue, JSON.stringify({ ar: "أزرق تيتانيوم", en: "Titanium Blue" }), attributeIds.color],
            [valueIds.silver, JSON.stringify({ ar: "فضي", en: "Silver" }), attributeIds.color],
            [valueIds.gold, JSON.stringify({ ar: "ذهبي", en: "Gold" }), attributeIds.color],
            // Sizes
            [valueIds.small, JSON.stringify({ ar: "صغير (S)", en: "Small (S)" }), attributeIds.size],
            [valueIds.medium, JSON.stringify({ ar: "وسط (M)", en: "Medium (M)" }), attributeIds.size],
            [valueIds.large, JSON.stringify({ ar: "كبير (L)", en: "Large (L)" }), attributeIds.size],
            [valueIds.xlarge, JSON.stringify({ ar: "كبير جداً (XL)", en: "Extra Large (XL)" }), attributeIds.size],
            // Storages
            [valueIds.s128, JSON.stringify({ ar: "128 جيجابايت", en: "128 GB" }), attributeIds.storage],
            [valueIds.s256, JSON.stringify({ ar: "256 جيجابايت", en: "256 GB" }), attributeIds.storage],
            [valueIds.s512, JSON.stringify({ ar: "512 جيجابايت", en: "512 GB" }), attributeIds.storage],
            [valueIds.s1tb, JSON.stringify({ ar: "1 تيرابايت", en: "1 TB" }), attributeIds.storage],
            // RAM
            [valueIds.r8, JSON.stringify({ ar: "8 جيجابايت", en: "8 GB RAM" }), attributeIds.ram],
            [valueIds.r16, JSON.stringify({ ar: "16 جيجابايت", en: "16 GB RAM" }), attributeIds.ram],
            [valueIds.r32, JSON.stringify({ ar: "32 جيجابايت", en: "32 GB RAM" }), attributeIds.ram],
        ];
        for (const [vId, vName, aId] of valuesData) {
            await connection.query(`
        INSERT INTO \`${tenantDb}\`.\`value\` (\`id\`, \`name\`, \`attribute_id\`)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`);
      `, [vId, vName, aId]);
        }
        // 2.19 Products (15 Products)
        console.log("   -> Seeding 15 Real Products with Variants & Images...");
        const productsCatalog = [
            {
                id: "90000000-0000-0000-0000-000000000001",
                name: { ar: "آبل آيفون 15 برو ماكس (Apple iPhone 15 Pro Max)", en: "Apple iPhone 15 Pro Max" },
                description: { ar: "الهاتف الأقوى من أبل بتصميم التيتانيوم وشريحة A17 Pro الجبارة مع كاميرا بدقة 48 ميجابكسل وتقريب بصري 5x.", en: "Titanium design, A17 Pro chip, 48MP main camera with 5x optical zoom." },
                category_id: categoryIds.electronics,
                sub_category_id: categoryIds.smartphones,
                brand_id: brandIds.apple,
                discount_id: tenantDiscountIds.welcome10,
                flash_discount_id: null,
                tax_id: taxIds.vat14,
                image: "https://wegostores.com/uploads/iphone_15_pro_max.jpg",
                gallery: ["https://wegostores.com/uploads/iphone_15_side.jpg", "https://wegostores.com/uploads/iphone_15_back.jpg"],
                warranty_id: warrantyIds.oneYear,
                warranty_note: "ضمان الوكيل ضد عيوب الصناعة مع كشف دوري مجاني",
                today_deal: 1,
                free_shipping: 1,
                shipping_days: 2,
                attributes: [attributeIds.color, attributeIds.storage],
                variants: [
                    { values: [valueIds.black, valueIds.s256], sku: "IP15PM-BLK-256", qty: 25, price: 62000.00, img: "https://wegostores.com/uploads/ip15_black.jpg" },
                    { values: [valueIds.blue, valueIds.s512], sku: "IP15PM-BLU-512", qty: 15, price: 69500.00, img: "https://wegostores.com/uploads/ip15_blue.jpg" },
                    { values: [valueIds.white, valueIds.s1tb], sku: "IP15PM-WHT-1TB", qty: 8, price: 78000.00, img: "https://wegostores.com/uploads/ip15_white.jpg" },
                ],
            },
            {
                id: "90000000-0000-0000-0000-000000000002",
                name: { ar: "سامسونج جالاكسي S24 ألترا (Samsung Galaxy S24 Ultra)", en: "Samsung Galaxy S24 Ultra" },
                description: { ar: "قوة الذكاء الاصطناعي Galaxy AI مع قلم S Pen وشاشة Dynamic AMOLED 2X فائقة السطوع.", en: "Equipped with Galaxy AI, titanium frame, S Pen, and 200MP camera." },
                category_id: categoryIds.electronics,
                sub_category_id: categoryIds.smartphones,
                brand_id: brandIds.samsung,
                discount_id: null,
                flash_discount_id: tenantFlashIds.weekend25,
                tax_id: taxIds.vat14,
                image: "https://wegostores.com/uploads/s24_ultra.jpg",
                gallery: ["https://wegostores.com/uploads/s24_back.jpg"],
                warranty_id: warrantyIds.twoYears,
                warranty_note: "سنتان ضمان من سامسونج مصر",
                today_deal: 1,
                free_shipping: 1,
                shipping_days: 1,
                attributes: [attributeIds.color, attributeIds.storage],
                variants: [
                    { values: [valueIds.black, valueIds.s256], sku: "S24U-BLK-256", qty: 30, price: 54000.00, img: "https://wegostores.com/uploads/s24_black.jpg" },
                    { values: [valueIds.silver, valueIds.s512], sku: "S24U-SLV-512", qty: 18, price: 61000.00, img: "https://wegostores.com/uploads/s24_silver.jpg" },
                ],
            },
            {
                id: "90000000-0000-0000-0000-000000000003",
                name: { ar: "آبل ماك بوك برو 14 إنش M3 Pro", en: "Apple MacBook Pro 14 M3 Pro" },
                description: { ar: "أداء خرافي للمصممين والمطورين مع شاشة Liquid Retina XDR وبطارية تصل إلى 18 ساعة.", en: "Unmatched performance with M3 Pro chip and Liquid Retina XDR display." },
                category_id: categoryIds.electronics,
                sub_category_id: categoryIds.laptops,
                brand_id: brandIds.apple,
                discount_id: null,
                flash_discount_id: null,
                tax_id: taxIds.vat14,
                image: "https://wegostores.com/uploads/mbp14.jpg",
                gallery: ["https://wegostores.com/uploads/mbp14_keyboard.jpg"],
                warranty_id: warrantyIds.oneYear,
                warranty_note: "ضمان آبل الدولي لمدة عام كامل",
                today_deal: 0,
                free_shipping: 1,
                shipping_days: 2,
                attributes: [attributeIds.color, attributeIds.ram, attributeIds.storage],
                variants: [
                    { values: [valueIds.silver, valueIds.r16, valueIds.s512], sku: "MBP14-SLV-16-512", qty: 10, price: 89000.00, img: "https://wegostores.com/uploads/mbp14_silver.jpg" },
                    { values: [valueIds.black, valueIds.r32, valueIds.s1tb], sku: "MBP14-BLK-32-1TB", qty: 5, price: 115000.00, img: "https://wegostores.com/uploads/mbp14_black.jpg" },
                ],
            },
            {
                id: "90000000-0000-0000-0000-000000000004",
                name: { ar: "ديل XPS 15 9530 لابتوب للمحترفين", en: "Dell XPS 15 9530 Laptop" },
                description: { ar: "معالج Intel Core i9 الجيل 13 مع كارت شاشة RTX 4070 وشاشة 3.5K OLED لمس.", en: "Intel Core i9 13th Gen with RTX 4070 and 3.5K OLED touchscreen." },
                category_id: categoryIds.electronics,
                sub_category_id: categoryIds.laptops,
                brand_id: brandIds.dell,
                discount_id: tenantDiscountIds.coupon100,
                flash_discount_id: null,
                tax_id: taxIds.vat14,
                image: "https://wegostores.com/uploads/dell_xps15.jpg",
                gallery: ["https://wegostores.com/uploads/dell_xps_open.jpg"],
                warranty_id: warrantyIds.twoYears,
                warranty_note: "ضمان محلي شامل قطع الغيار",
                today_deal: 0,
                free_shipping: 1,
                shipping_days: 3,
                attributes: [attributeIds.ram, attributeIds.storage],
                variants: [
                    { values: [valueIds.r16, valueIds.s512], sku: "XPS15-16-512", qty: 8, price: 78000.00, img: "https://wegostores.com/uploads/dell_xps.jpg" },
                    { values: [valueIds.r32, valueIds.s1tb], sku: "XPS15-32-1TB", qty: 4, price: 92000.00, img: "https://wegostores.com/uploads/dell_xps.jpg" },
                ],
            },
            {
                id: "90000000-0000-0000-0000-000000000005",
                name: { ar: "سماعات سوني اللاسلكية WH-1000XM5 عازلة للضوضاء", en: "Sony WH-1000XM5 Wireless Headphones" },
                description: { ar: "أفضل تقنية عزل ضوضاء في العالم مع صوت عالي الدقة وبطارية تدوم 30 ساعة.", en: "Industry leading noise canceling with 30-hour battery life." },
                category_id: categoryIds.electronics,
                sub_category_id: categoryIds.audio,
                brand_id: brandIds.sony,
                discount_id: tenantDiscountIds.welcome10,
                flash_discount_id: null,
                tax_id: taxIds.vat14,
                image: "https://wegostores.com/uploads/sony_wh1000xm5.jpg",
                gallery: ["https://wegostores.com/uploads/sony_case.jpg"],
                warranty_id: warrantyIds.oneYear,
                warranty_note: "سنة ضمان ضد عيوب الصناعة",
                today_deal: 1,
                free_shipping: 0,
                shipping_days: 1,
                attributes: [attributeIds.color],
                variants: [
                    { values: [valueIds.black], sku: "SONY-XM5-BLK", qty: 35, price: 16500.00, img: "https://wegostores.com/uploads/sony_black.jpg" },
                    { values: [valueIds.silver], sku: "SONY-XM5-SLV", qty: 20, price: 16500.00, img: "https://wegostores.com/uploads/sony_silver.jpg" },
                ],
            },
            {
                id: "90000000-0000-0000-0000-000000000006",
                name: { ar: "حذاء الجري نايكي إير ماكس 270 (Nike Air Max 270)", en: "Nike Air Max 270 Running Shoes" },
                description: { ar: "وسادة هوائية ضخمة توفر أقصى درجات الراحة والمرونة طوال اليوم مع تصميم عصري مميز.", en: "Big Air unit delivers unmatched all-day comfort with sleek modern aesthetics." },
                category_id: categoryIds.fashion,
                sub_category_id: categoryIds.mensWear,
                brand_id: brandIds.nike,
                discount_id: null,
                flash_discount_id: tenantFlashIds.weekend25,
                tax_id: taxIds.vat14,
                image: "https://wegostores.com/uploads/nike_am270.jpg",
                gallery: ["https://wegostores.com/uploads/nike_side.jpg"],
                warranty_id: warrantyIds.thirtyDays,
                warranty_note: "استبدال واسترجاع المقاس مجاناً",
                today_deal: 1,
                free_shipping: 0,
                shipping_days: 2,
                attributes: [attributeIds.color, attributeIds.size],
                variants: [
                    { values: [valueIds.black, valueIds.medium], sku: "AM270-BLK-42", qty: 40, price: 4200.00, img: "https://wegostores.com/uploads/nike_black.jpg" },
                    { values: [valueIds.white, valueIds.large], sku: "AM270-WHT-43", qty: 30, price: 4200.00, img: "https://wegostores.com/uploads/nike_white.jpg" },
                ],
            },
            {
                id: "90000000-0000-0000-0000-000000000007",
                name: { ar: "حذاء أديداس ألترا بوست لايت (Adidas Ultraboost Light)", en: "Adidas Ultraboost Light" },
                description: { ar: "خفيف الوزن ومرن للغاية مع حشوة Boost الأسطورية التي تعيد الطاقة مع كل خطوة.", en: "Lightest Ultraboost ever made with 10% lower carbon footprint." },
                category_id: categoryIds.fashion,
                sub_category_id: categoryIds.mensWear,
                brand_id: brandIds.adidas,
                discount_id: tenantDiscountIds.vip15,
                flash_discount_id: null,
                tax_id: taxIds.vat14,
                image: "https://wegostores.com/uploads/adidas_ub.jpg",
                gallery: ["https://wegostores.com/uploads/adidas_ub_angle.jpg"],
                warranty_id: warrantyIds.thirtyDays,
                warranty_note: "ضمان أصالة المنتج 100%",
                today_deal: 0,
                free_shipping: 1,
                shipping_days: 2,
                attributes: [attributeIds.color, attributeIds.size],
                variants: [
                    { values: [valueIds.black, valueIds.large], sku: "UB-BLK-43", qty: 25, price: 4800.00, img: "https://wegostores.com/uploads/adidas_black.jpg" },
                    { values: [valueIds.blue, valueIds.xlarge], sku: "UB-BLU-44", qty: 15, price: 4800.00, img: "https://wegostores.com/uploads/adidas_blue.jpg" },
                ],
            },
            {
                id: "90000000-0000-0000-0000-000000000008",
                name: { ar: "قميص كلاسيكي قطن 100% من زارا للرجال", en: "Zara Classic 100% Cotton Men's Shirt" },
                description: { ar: "قميص رسمي أنيق مصنوع من أنقى أنواع القطن المصري بقصة Slim Fit مثالية للمناسبات والعمل.", en: "Premium cotton classic dress shirt, slim fit tailored for business and occasions." },
                category_id: categoryIds.fashion,
                sub_category_id: categoryIds.mensWear,
                brand_id: brandIds.zara,
                discount_id: null,
                flash_discount_id: null,
                tax_id: taxIds.vat14,
                image: "https://wegostores.com/uploads/zara_shirt.jpg",
                gallery: ["https://wegostores.com/uploads/zara_shirt_zoom.jpg"],
                warranty_id: warrantyIds.thirtyDays,
                warranty_note: "استبدال مقاس خلال 30 يوم",
                today_deal: 0,
                free_shipping: 0,
                shipping_days: 2,
                attributes: [attributeIds.color, attributeIds.size],
                variants: [
                    { values: [valueIds.white, valueIds.medium], sku: "ZARA-SHIRT-WHT-M", qty: 50, price: 1250.00, img: "https://wegostores.com/uploads/shirt_white.jpg" },
                    { values: [valueIds.blue, valueIds.large], sku: "ZARA-SHIRT-BLU-L", qty: 45, price: 1250.00, img: "https://wegostores.com/uploads/shirt_blue.jpg" },
                ],
            },
            {
                id: "90000000-0000-0000-0000-000000000009",
                name: { ar: "فستان نسائي حرير صيفي مطرز من زارا", en: "Zara Embroidered Silk Summer Dress" },
                description: { ar: "تصميم أنيق ومريح من الحرير الناعم مع نقشات ورود فريدة وألوان زاهية لموسم الصيف.", en: "Elegant silk dress featuring delicate floral embroidery and breathable fit." },
                category_id: categoryIds.fashion,
                sub_category_id: categoryIds.womensWear,
                brand_id: brandIds.zara,
                discount_id: tenantDiscountIds.welcome10,
                flash_discount_id: null,
                tax_id: taxIds.vat14,
                image: "https://wegostores.com/uploads/zara_dress.jpg",
                gallery: ["https://wegostores.com/uploads/dress_back.jpg"],
                warranty_id: warrantyIds.thirtyDays,
                warranty_note: "معاينة واستلام فوري",
                today_deal: 1,
                free_shipping: 1,
                shipping_days: 1,
                attributes: [attributeIds.color, attributeIds.size],
                variants: [
                    { values: [valueIds.white, valueIds.small], sku: "ZARA-DRESS-WHT-S", qty: 20, price: 2100.00, img: "https://wegostores.com/uploads/dress_white.jpg" },
                    { values: [valueIds.blue, valueIds.medium], sku: "ZARA-DRESS-BLU-M", qty: 15, price: 2100.00, img: "https://wegostores.com/uploads/dress_blue.jpg" },
                ],
            },
            {
                id: "90000000-0000-0000-0000-000000000010",
                name: { ar: "صانعة قهوة اسبريسو ديلونجي ديديكا ستايل", en: "DeLonghi Dedica Espresso Coffee Machine" },
                description: { ar: "ماكينة اسبريسو احترافية بتصميم إيطالي فخم ومضخة ضغط 15 بار مع مبخر حليب كريمي.", en: "15-bar professional pump espresso machine with manual cappuccino milk frother." },
                category_id: categoryIds.home,
                sub_category_id: categoryIds.coffeeMakers,
                brand_id: brandIds.philips,
                discount_id: tenantDiscountIds.coupon100,
                flash_discount_id: null,
                tax_id: taxIds.vat14,
                image: "https://wegostores.com/uploads/delonghi_dedica.jpg",
                gallery: ["https://wegostores.com/uploads/delonghi_frother.jpg"],
                warranty_id: warrantyIds.twoYears,
                warranty_note: "سنتان ضمان من الوكيل المعتمد",
                today_deal: 1,
                free_shipping: 1,
                shipping_days: 2,
                attributes: [attributeIds.color],
                variants: [
                    { values: [valueIds.silver], sku: "DELONGHI-EC685-SLV", qty: 20, price: 8900.00, img: "https://wegostores.com/uploads/dedica_silver.jpg" },
                    { values: [valueIds.black], sku: "DELONGHI-EC685-BLK", qty: 15, price: 8900.00, img: "https://wegostores.com/uploads/dedica_black.jpg" },
                ],
            },
            {
                id: "90000000-0000-0000-0000-000000000011",
                name: { ar: "قلاية فيليبس الهوائية XXL بدون زيت", en: "Philips Airfryer XXL Essential" },
                description: { ar: "تقنية Rapid Air لإعداد طعام صحي ومقرمش بدهون أقل بنسبة تصل إلى 90% وسعة عائلية 7.2 لتر.", en: "Fry with little or no added oil with Rapid Air technology and 7.2L family capacity." },
                category_id: categoryIds.home,
                sub_category_id: null,
                brand_id: brandIds.philips,
                discount_id: null,
                flash_discount_id: tenantFlashIds.midnight200,
                tax_id: taxIds.vat14,
                image: "https://wegostores.com/uploads/philips_airfryer.jpg",
                gallery: ["https://wegostores.com/uploads/airfryer_open.jpg"],
                warranty_id: warrantyIds.twoYears,
                warranty_note: "ضمان فيليبس العالمي لمدة عامين",
                today_deal: 0,
                free_shipping: 1,
                shipping_days: 2,
                attributes: [attributeIds.color],
                variants: [
                    { values: [valueIds.black], sku: "PHILIPS-XXL-BLK", qty: 30, price: 9500.00, img: "https://wegostores.com/uploads/airfryer_black.jpg" },
                ],
            },
            {
                id: "90000000-0000-0000-0000-000000000012",
                name: { ar: "ساعة آبل الذكية الجيل التاسع (Apple Watch Series 9)", en: "Apple Watch Series 9 GPS 45mm" },
                description: { ar: "شريحة S9 فائقة السرعة مع إيماءة الضغط المزدوج المبتكرة وشاشة أكثر سطوعاً ومستشعرات صحة متقدمة.", en: "S9 chip, innovative Double Tap gesture, and brighter display with health tracking." },
                category_id: categoryIds.electronics,
                sub_category_id: null,
                brand_id: brandIds.apple,
                discount_id: tenantDiscountIds.welcome10,
                flash_discount_id: null,
                tax_id: taxIds.vat14,
                image: "https://wegostores.com/uploads/apple_watch_9.jpg",
                gallery: ["https://wegostores.com/uploads/apple_watch_back.jpg"],
                warranty_id: warrantyIds.oneYear,
                warranty_note: "سنة ضمان ضد عيوب الصناعة",
                today_deal: 1,
                free_shipping: 1,
                shipping_days: 1,
                attributes: [attributeIds.color],
                variants: [
                    { values: [valueIds.black], sku: "AW9-45-BLK", qty: 22, price: 21500.00, img: "https://wegostores.com/uploads/watch_black.jpg" },
                    { values: [valueIds.silver], sku: "AW9-45-SLV", qty: 14, price: 21500.00, img: "https://wegostores.com/uploads/watch_silver.jpg" },
                ],
            },
            {
                id: "90000000-0000-0000-0000-000000000013",
                name: { ar: "تلفزيون سامسونج 65 إنش QLED 4K ذكي", en: "Samsung 65-inch QLED 4K Smart TV" },
                description: { ar: "حجم ألوان بنسبة 100% مع تقنية Quantum Dot ومعالج Quantum 4K وسماعات محيطية ثلاثية الأبعاد.", en: "100% color volume with Quantum Dot and powerful Quantum Processor 4K." },
                category_id: categoryIds.electronics,
                sub_category_id: null,
                brand_id: brandIds.samsung,
                discount_id: null,
                flash_discount_id: tenantFlashIds.weekend25,
                tax_id: taxIds.vat14,
                image: "https://wegostores.com/uploads/samsung_qled_65.jpg",
                gallery: ["https://wegostores.com/uploads/tv_ports.jpg"],
                warranty_id: warrantyIds.twoYears,
                warranty_note: "سنتان ضمان من سامسونج مصر مع تركيب مجاني",
                today_deal: 1,
                free_shipping: 1,
                shipping_days: 3,
                attributes: [attributeIds.color],
                variants: [
                    { values: [valueIds.black], sku: "SAM-QLED-65-BLK", qty: 12, price: 29900.00, img: "https://wegostores.com/uploads/tv_black.jpg" },
                ],
            },
            {
                id: "90000000-0000-0000-0000-000000000014",
                name: { ar: "جهاز سوني بلايستيشن 5 سليم (PlayStation 5 Slim)", en: "Sony PlayStation 5 Slim Edition" },
                description: { ar: "تصميم أنحف مع وحدة تخزين SSD سعة 1 تيرابايت ويد تحكم لاسلكية DualSense بتقنية الاستجابة اللمسية.", en: "Slimmer design, 1TB SSD storage, ultra-fast loading, and DualSense controller." },
                category_id: categoryIds.electronics,
                sub_category_id: null,
                brand_id: brandIds.sony,
                discount_id: tenantDiscountIds.coupon100,
                flash_discount_id: null,
                tax_id: taxIds.vat14,
                image: "https://wegostores.com/uploads/ps5_slim.jpg",
                gallery: ["https://wegostores.com/uploads/ps5_controller.jpg"],
                warranty_id: warrantyIds.oneYear,
                warranty_note: "سنة ضمان سوني ضد عيوب الصناعة",
                today_deal: 1,
                free_shipping: 1,
                shipping_days: 1,
                attributes: [attributeIds.color, attributeIds.storage],
                variants: [
                    { values: [valueIds.white, valueIds.s1tb], sku: "PS5-SLIM-1TB", qty: 40, price: 27500.00, img: "https://wegostores.com/uploads/ps5_white.jpg" },
                ],
            },
            {
                id: "90000000-0000-0000-0000-000000000015",
                name: { ar: "آيباد إير بشريحة M2 شاشة 11 إنش", en: "Apple iPad Air 11-inch M2" },
                description: { ar: "قوة وسرعة خيالية مع شريحة Apple M2 ودعم قلم Apple Pencil Pro ولوحة مفاتيح Magic Keyboard.", en: "Incredible performance with M2 chip and support for Apple Pencil Pro." },
                category_id: categoryIds.electronics,
                sub_category_id: null,
                brand_id: brandIds.apple,
                discount_id: null,
                flash_discount_id: null,
                tax_id: taxIds.vat14,
                image: "https://wegostores.com/uploads/ipad_air_m2.jpg",
                gallery: ["https://wegostores.com/uploads/ipad_back.jpg"],
                warranty_id: warrantyIds.oneYear,
                warranty_note: "سنة ضمان محلي ضد عيوب الصناعة",
                today_deal: 0,
                free_shipping: 1,
                shipping_days: 2,
                attributes: [attributeIds.color, attributeIds.storage],
                variants: [
                    { values: [valueIds.blue, valueIds.s128], sku: "IPAD-M2-BLU-128", qty: 25, price: 34000.00, img: "https://wegostores.com/uploads/ipad_blue.jpg" },
                    { values: [valueIds.silver, valueIds.s256], sku: "IPAD-M2-SLV-256", qty: 18, price: 39500.00, img: "https://wegostores.com/uploads/ipad_silver.jpg" },
                ],
            },
        ];
        for (const prod of productsCatalog) {
            // 1. Insert product
            await connection.query(`
        INSERT INTO \`${tenantDb}\`.\`products\` (
          \`id\`, \`name\`, \`description\`, \`category_id\`, \`sub_category_id\`, \`brand_id\`, 
          \`discount_id\`, \`flash_discount_id\`, \`tax_id\`, \`image\`, \`warrantly_id\`, 
          \`warrantly_note\`, \`today_deal\`, \`free_shipping\`, \`shipping_days\`, 
          \`gallery\`, \`published\`
        ) VALUES (
          ?, ?, ?, ?, ?, ?, 
          ?, ?, ?, ?, ?, 
          ?, ?, ?, ?, 
          ?, 1
        ) ON DUPLICATE KEY UPDATE 
          \`name\` = VALUES(\`name\`),
          \`description\` = VALUES(\`description\`),
          \`image\` = VALUES(\`image\`),
          \`published\` = 1;
      `, [
                prod.id,
                JSON.stringify(prod.name),
                JSON.stringify(prod.description),
                prod.category_id,
                prod.sub_category_id,
                prod.brand_id,
                prod.discount_id,
                prod.flash_discount_id,
                prod.tax_id,
                prod.image,
                prod.warranty_id,
                prod.warranty_note,
                prod.today_deal,
                prod.free_shipping,
                prod.shipping_days,
                JSON.stringify(prod.gallery),
            ]);
            // 2. Insert product attributes
            for (const attrId of prod.attributes) {
                await connection.query(`
          INSERT INTO \`${tenantDb}\`.\`product_attribute\` (\`id\`, \`product_id\`, \`attribute_id\`)
          VALUES (UUID(), ?, ?)
          ON DUPLICATE KEY UPDATE \`attribute_id\` = VALUES(\`attribute_id\`);
        `, [prod.id, attrId]);
            }
            // 3. Insert product variants (product_values)
            for (const variant of prod.variants) {
                await connection.query(`
          INSERT INTO \`${tenantDb}\`.\`product_values\` 
            (\`id\`, \`product_id\`, \`value_ids\`, \`sku\`, \`quantity\`, \`image\`, \`price\`)
          VALUES (UUID(), ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE 
            \`quantity\` = VALUES(\`quantity\`),
            \`price\` = VALUES(\`price\`);
        `, [
                    prod.id,
                    JSON.stringify(variant.values),
                    variant.sku,
                    variant.qty,
                    variant.img,
                    variant.price,
                ]);
            }
        }
        // 2.20 Payment Gateways Sandbox Credentials
        console.log("   -> Seeding Payment Gateways Sandbox (Gedia, Paymob, Kashier, Fawry)...");
        await connection.query(`
      INSERT INTO \`${tenantDb}\`.\`paymob\` (\`id\`, \`name\`, \`logo\`, \`api_key\`, \`integration_id\`, \`iframe_id\`, \`hmac\`, \`type\`, \`status\`)
      VALUES (
        UUID(), 
        ?, 
        'https://wegostores.com/uploads/paymob.png', 
        'sandbox_api_key_test_1234567890abcdef', 
        '123456', 
        '789012', 
        'sandbox_hmac_secret_hash_key', 
        'test',
        1
      );
    `, [JSON.stringify({ ar: "باي موب (Paymob)", en: "Paymob Gateway" })]);
        await connection.query(`
      INSERT INTO \`${tenantDb}\`.\`gedia\` (\`id\`, \`name\`, \`logo\`, \`public_key\`, \`api_password\`, \`environment\`, \`status\`)
      VALUES (
        UUID(), 
        ?, 
        'https://wegostores.com/uploads/gedia.png', 
        'sandbox_public_key_gedia_test', 
        'sandbox_password_gedia_test', 
        'egypt', 
        1
      );
    `, [JSON.stringify({ ar: "جيديا (Geidea)", en: "Geidea Payments" })]);
        await connection.query(`
      INSERT INTO \`${tenantDb}\`.\`fawry\` (\`id\`, \`name\`, \`logo\`, \`merchant_code\`, \`merchant_secret_key\`, \`fawry_base_url\`, \`status\`)
      VALUES (
        UUID(), 
        ?, 
        'https://wegostores.com/uploads/fawry.png', 
        'MERCHANT_TEST_001', 
        'sec_key_fawry_sandbox_test', 
        'Staging',
        1
      );
    `, [JSON.stringify({ ar: "شبكة فوري (Fawry)", en: "Fawry Gateway" })]);
        await connection.query(`
      INSERT INTO \`${tenantDb}\`.\`kashier\` (\`id\`, \`name\`, \`logo\`, \`merchant_id\`, \`api_key\`, \`secret_key\`, \`status\`)
      VALUES (
        UUID(), 
        ?, 
        'https://wegostores.com/uploads/kashier.png', 
        'MID-TEST-9988', 
        'kashier_api_test_key', 
        'kashier_secret_test_key', 
        1
      );
    `, [JSON.stringify({ ar: "كاشير (Kashier)", en: "Kashier Payments" })]);
        await connection.query("SET FOREIGN_KEY_CHECKS = 1;");
        console.log("✅ [PART 2 COMPLETE] Tenant `ahmed` seeded successfully with all 22 tables!\n");
        // =========================================================================
        // SUMMARY
        // =========================================================================
        console.log("==================================================================");
        console.log("🎉 ALL SEEDING TASKS FINISHED SUCCESSFULLY!");
        console.log("==================================================================");
        console.log("👤 CENTRAL SUPER ADMIN CREDENTIALS:");
        console.log("   - Email:    admin@gmail.com");
        console.log("   - Password: 123456789");
        console.log("   - Database: wegostore.admins");
        console.log("");
        console.log("🏪 CENTRAL TENANT RECORD:");
        console.log("   - Subdomain: ahmed");
        console.log("   - Email:     ahmed@gmail.com");
        console.log("   - Phone:     123456789");
        console.log("   - Database:  wegostore.users");
        console.log("");
        console.log("🔑 TENANT ADMIN (AHMED STORE) CREDENTIALS:");
        console.log("   - Subdomain: ahmed (or header x-subdomain: ahmed)");
        console.log("   - Email:     ahmed@gmail.com");
        console.log("   - Phone:     123456789");
        console.log("   - Password:  123456789");
        console.log("   - Database:  ahmed.admin");
        console.log("   - Role:      admin (Full permissions)");
        console.log("==================================================================");
    }
    catch (error) {
        console.error("❌ Fatal error during seeding:", error);
        throw error;
    }
    finally {
        await connection.end();
    }
}
runSeed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
