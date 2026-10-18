"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.packages = exports.packageTypeEnum = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.packageTypeEnum = (0, mysql_core_1.mysqlEnum)("type", [
    "monthly",
    "quarterly",
    "biannual",
    "annual",
]);
exports.packages = (0, mysql_core_1.mysqlTable)("packages", {
    id: (0, mysql_core_1.char)("id", { length: 36 })
        .primaryKey()
        .default((0, drizzle_orm_1.sql) `(UUID())`),
    name: (0, mysql_core_1.json)("name").$type().notNull(),
    type: (0, mysql_core_1.mysqlEnum)("type", [
        "monthly",
        "quarterly",
        "biannual",
        "annual",
    ]).notNull().default("monthly"),
    price: (0, mysql_core_1.decimal)("price", { precision: 10, scale: 2 }).notNull(),
    status: (0, mysql_core_1.boolean)("status").notNull().default(true),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow().notNull(),
});
