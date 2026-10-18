"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRelations = exports.users = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
const orders_1 = require("./orders");
const packages_1 = require("./packages");
const userOrders_1 = require("./userOrders");
exports.users = (0, mysql_core_1.mysqlTable)("users", {
    id: (0, mysql_core_1.char)("id", { length: 36 })
        .primaryKey()
        .default((0, drizzle_orm_1.sql) `(UUID())`),
    name: (0, mysql_core_1.varchar)("name", { length: 255 }).notNull(),
    email: (0, mysql_core_1.varchar)("email", { length: 255 }).notNull().unique(),
    subdomain: (0, mysql_core_1.varchar)("subdomain", { length: 255 }).notNull().unique(),
    phone: (0, mysql_core_1.varchar)("phone", { length: 50 }).notNull().unique(),
    password: (0, mysql_core_1.varchar)("password", { length: 255 }).notNull(),
    package_id: (0, mysql_core_1.char)("package_id", { length: 36 }).references(() => packages_1.packages.id, {
        onDelete: "set null",
    }),
    start_date: (0, mysql_core_1.date)("start_date", { mode: "string" }),
    end_date: (0, mysql_core_1.date)("end_date", { mode: "string" }),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow().notNull(),
});
exports.usersRelations = (0, drizzle_orm_1.relations)(exports.users, ({ one, many }) => ({
    package: one(packages_1.packages, {
        fields: [exports.users.package_id],
        references: [packages_1.packages.id],
    }),
    orders: many(orders_1.orders),
    userOrders: many(userOrders_1.userOrders),
}));
