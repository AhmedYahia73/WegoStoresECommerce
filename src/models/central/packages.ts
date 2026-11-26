import { mysqlTable, char, json, decimal, int, timestamp } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const packages = mysqlTable("packages", {
  id: char("id", { length: 36 })
    .primaryKey()
    .default(sql`(UUID())`),
  name: json("name").$type<{ [key: string]: string }>().notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  orders_from: int("orders_from").notNull().default(0),
  orders_to: int("orders_to"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
