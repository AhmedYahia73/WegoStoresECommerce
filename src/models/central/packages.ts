import { mysqlTable, char, json, decimal, timestamp, mysqlEnum, boolean } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const packageTypeEnum = mysqlEnum("type", [
  "monthly",
  "quarterly",
  "biannual",
  "annual",
]);

export const packages = mysqlTable("packages", {
  id: char("id", { length: 36 })
    .primaryKey()
    .default(sql`(UUID())`),
  name: json("name").$type<{ [key: string]: string }>().notNull(),
  type: mysqlEnum("type", [
    "monthly",
    "quarterly",
    "biannual",
    "annual",
  ]).notNull().default("monthly"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  status: boolean("status").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
