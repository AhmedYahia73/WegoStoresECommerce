import { mysqlTable, char, decimal, timestamp, mysqlEnum, text } from "drizzle-orm/mysql-core";
import { sql, relations } from "drizzle-orm";
import { users } from "./users";
import { packages } from "./packages";
import { discounts } from "./discounts";

export const userOrderStatusEnum = mysqlEnum("status", ["pending", "approve", "reject"]);

export const userOrders = mysqlTable("user_orders", {
  id: char("id", { length: 36 })
    .primaryKey()
    .default(sql`(UUID())`),
  package_id: char("package_id", { length: 36 })
    .notNull()
    .references(() => packages.id, { onDelete: "restrict" }),
  discount_id: char("discount_id", { length: 36 })
    .references(() => discounts.id, { onDelete: "set null" }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).notNull().default("0.00"),
  final_price: decimal("final_price", { precision: 10, scale: 2 }).notNull(),
  user_id: char("user_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: mysqlEnum("status", ["pending", "approve", "reject"]).notNull().default("pending"),
  reject_reason: text("reject_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const userOrdersRelations = relations(userOrders, ({ one }) => ({
  user: one(users, {
    fields: [userOrders.user_id],
    references: [users.id],
  }),
  package: one(packages, {
    fields: [userOrders.package_id],
    references: [packages.id],
  }),
  discount: one(discounts, {
    fields: [userOrders.discount_id],
    references: [discounts.id],
  }),
}));
