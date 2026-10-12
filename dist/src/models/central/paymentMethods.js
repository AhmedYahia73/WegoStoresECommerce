"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentMethods = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.paymentMethods = (0, mysql_core_1.mysqlTable)("payment_methods", {
    id: (0, mysql_core_1.char)("id", { length: 36 })
        .primaryKey()
        .default((0, drizzle_orm_1.sql) `(UUID())`),
    name: (0, mysql_core_1.varchar)("name", { length: 255 }).notNull(),
    icon: (0, mysql_core_1.varchar)("icon", { length: 500 }).notNull(),
    description: (0, mysql_core_1.text)("description"),
    status: (0, mysql_core_1.boolean)("status").default(true).notNull(),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow().notNull(),
});
