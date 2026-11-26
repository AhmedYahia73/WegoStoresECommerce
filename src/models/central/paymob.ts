import { mysqlTable, char, json, varchar, text, mysqlEnum, boolean, timestamp } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const paymob = mysqlTable("paymob", {
  id: char("id", { length: 36 })
    .primaryKey()
    .default(sql`(UUID())`),
  name: json("name").$type<{ [key: string]: string }>().notNull(),
  logo: varchar("logo", { length: 500 }).notNull(),
  api_key: text("api_key").notNull(),
  iframe_id: varchar("iframe_id", { length: 255 }).notNull(),
  integration_id: varchar("integration_id", { length: 255 }).notNull(),
  hmac: text("hmac").notNull(),
  type: mysqlEnum("type", ["test", "live"]).notNull().default("test"),
  status: boolean("status").notNull().default(true),
  callback_url: varchar("callback_url", { length: 500 }).default("{subdomain}/api/paymob_callback"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
