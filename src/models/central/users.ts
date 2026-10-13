import { mysqlTable, char, varchar, date, timestamp } from "drizzle-orm/mysql-core";
import { sql, relations } from "drizzle-orm";
import { orders } from "./orders";
import { packages } from "./packages";
import { userOrders } from "./userOrders";

export const users = mysqlTable("users", {
  id: char("id", { length: 36 })
    .primaryKey()
    .default(sql`(UUID())`),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  subdomain: varchar("subdomain", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 50 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  package_id: char("package_id", { length: 36 }).references(() => packages.id, {
    onDelete: "set null",
  }),
  start_date: date("start_date", { mode: "string" }),
  end_date: date("end_date", { mode: "string" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  package: one(packages, {
    fields: [users.package_id],
    references: [packages.id],
  }),
  orders: many(orders),
  userOrders: many(userOrders),
}));
