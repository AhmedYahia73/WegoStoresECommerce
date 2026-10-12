"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.admins = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.admins = (0, mysql_core_1.mysqlTable)("admins", {
    id: (0, mysql_core_1.char)("id", { length: 36 })
        .primaryKey()
        .default((0, drizzle_orm_1.sql) `(UUID())`),
    name: (0, mysql_core_1.varchar)("name", { length: 255 }).notNull(),
    email: (0, mysql_core_1.varchar)("email", { length: 255 }).notNull().unique(),
    password: (0, mysql_core_1.varchar)("password", { length: 255 }).notNull(),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow().notNull(),
});
