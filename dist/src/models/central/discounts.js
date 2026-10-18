"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.discounts = exports.discountTypeEnum = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.discountTypeEnum = (0, mysql_core_1.mysqlEnum)("type", ["percentage", "value"]);
exports.discounts = (0, mysql_core_1.mysqlTable)("discounts", {
    id: (0, mysql_core_1.char)("id", { length: 36 })
        .primaryKey()
        .default((0, drizzle_orm_1.sql) `(UUID())`),
    name: (0, mysql_core_1.json)("name").$type().notNull(),
    amount: (0, mysql_core_1.decimal)("amount", { precision: 10, scale: 2 }).notNull(),
    type: (0, mysql_core_1.mysqlEnum)("type", ["percentage", "value"]).notNull().default("percentage"),
    start_date: (0, mysql_core_1.date)("start_date", { mode: "string" }).notNull(),
    end_date: (0, mysql_core_1.date)("end_date", { mode: "string" }).notNull(),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow().notNull(),
});
