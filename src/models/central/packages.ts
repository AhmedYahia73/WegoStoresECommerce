import { mysqlTable, char, varchar, int, decimal, timestamp } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const packages = mysqlTable("packages", {
  id: char("id", { length: 36 })
    .primaryKey()
    .default(sql`(UUID())`),
  name: varchar("name", { length: 255 }).notNull(),
  orders_num: int("orders_num").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
