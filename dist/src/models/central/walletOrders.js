"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.walletOrdersRelations = exports.walletOrders = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
const users_1 = require("./users");
exports.walletOrders = (0, mysql_core_1.mysqlTable)("wallet_orders", {
    id: (0, mysql_core_1.char)("id", { length: 36 })
        .primaryKey()
        .default((0, drizzle_orm_1.sql) `(UUID())`),
    wallet: (0, mysql_core_1.decimal)("wallet", { precision: 10, scale: 2 }).notNull(),
    user_id: (0, mysql_core_1.char)("user_id", { length: 36 })
        .notNull()
        .references(() => users_1.users.id, { onDelete: "cascade" }),
    status: (0, mysql_core_1.mysqlEnum)("status", ["pending", "approve", "reject", "faild"]).notNull().default("pending"),
    reject_reason: (0, mysql_core_1.text)("reject_reason"),
    receipt: (0, mysql_core_1.varchar)("receipt", { length: 500 }),
    transaction_id: (0, mysql_core_1.varchar)("transaction_id", { length: 255 }),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow().notNull(),
});
exports.walletOrdersRelations = (0, drizzle_orm_1.relations)(exports.walletOrders, ({ one }) => ({
    user: one(users_1.users, {
        fields: [exports.walletOrders.user_id],
        references: [users_1.users.id],
    }),
}));
