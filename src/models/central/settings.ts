import { mysqlTable, char, int, timestamp } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const settings = mysqlTable("settings", {
  id: char("id", { length: 36 })
    .primaryKey()
    .default(sql`(UUID())`),
  perimission_days: int("perimission_days").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
