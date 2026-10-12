"use strict";
// src/seeds/01_admin.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const bcrypt_1 = __importDefault(require("bcrypt"));
const seed = {
    name: "01_admin",
    async run() {
        console.log("   📝 Inserting default admin...");
        const defaultPassword = await bcrypt_1.default.hash("password123", 10);
        const adminsData = [
            {
                name: "مدير النظام",
                email: "admin@admin.com",
                password: defaultPassword,
            },
        ];
        console.log("   📥 Saving Admin...");
        await db_1.db.insert(schema_1.admins).values(adminsData);
        console.log("   🚀 Completed! Seeded default admin.");
    },
    async rollback() {
        console.log("   🗑️ Rolling back seeded admin...");
        await db_1.db.delete(schema_1.admins).where((0, drizzle_orm_1.eq)(schema_1.admins.email, "admin@admin.com"));
        console.log("   ✅ Rollback completed successfully.");
    },
};
exports.default = seed;
