import { mysqlTable, char, decimal, timestamp, mysqlEnum, text, varchar } from "drizzle-orm/mysql-core";
import { sql, relations } from "drizzle-orm";
import { users } from "./users";
import { packages } from "./packages";

export const userOrderStatusEnum = mysqlEnum("status", ["pending", "approve", "reject", "faild"]);

export const userOrders = mysqlTable("user_orders", {
  id: char("id", { length: 36 })
    .primaryKey()
    .default(sql`(UUID())`),
  package_id: char("package_id", { length: 36 })
    .notNull()
    .references(() => packages.id, { onDelete: "restrict" }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  user_id: char("user_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: mysqlEnum("status", ["pending", "approve", "reject", "faild"]).notNull().default("pending"),
  reject_reason: text("reject_reason"),
  receipt: varchar("receipt", { length: 500 }),
  transaction_id: varchar("transaction_id", { length: 255 }),
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
}));
