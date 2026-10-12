"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.packages = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.packages = (0, mysql_core_1.mysqlTable)("packages", {
    id: (0, mysql_core_1.char)("id", { length: 36 })
        .primaryKey()
        .default((0, drizzle_orm_1.sql) `(UUID())`),
    name: (0, mysql_core_1.varchar)("name", { length: 255 }).notNull(),
    orders_num: (0, mysql_core_1.int)("orders_num").notNull(),
    price: (0, mysql_core_1.decimal)("price", { precision: 10, scale: 2 }).notNull(),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow().notNull(),
});
