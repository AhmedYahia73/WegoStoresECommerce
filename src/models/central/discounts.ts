import { mysqlTable, char, json, decimal, timestamp, mysqlEnum, date } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const discountTypeEnum = mysqlEnum("type", ["percentage", "value"]);

export const discounts = mysqlTable("discounts", {
  id: char("id", { length: 36 })
    .primaryKey()
    .default(sql`(UUID())`),
  name: json("name").$type<{ [key: string]: string }>().notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: mysqlEnum("type", ["percentage", "value"]).notNull().default("percentage"),
  start_date: date("start_date", { mode: "string" }).notNull(),
  end_date: date("end_date", { mode: "string" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
