"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ordersRelations = exports.orders = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
const users_1 = require("./users");
exports.orders = (0, mysql_core_1.mysqlTable)("orders", {
    id: (0, mysql_core_1.char)("id", { length: 36 })
        .primaryKey()
        .default((0, drizzle_orm_1.sql) `(UUID())`),
    user_id: (0, mysql_core_1.char)("user_id", { length: 36 })
        .notNull()
        .references(() => users_1.users.id, { onDelete: "cascade" }),
    total: (0, mysql_core_1.decimal)("total", { precision: 10, scale: 2 }).notNull(),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow().notNull(),
});
exports.ordersRelations = (0, drizzle_orm_1.relations)(exports.orders, ({ one }) => ({
    user: one(users_1.users, {
        fields: [exports.orders.user_id],
        references: [users_1.users.id],
    }),
}));
