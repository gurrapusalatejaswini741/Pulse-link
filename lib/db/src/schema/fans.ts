import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const fansTable = pgTable("fans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  seatSection: text("seat_section").notNull(),
  checkedIn: boolean("checked_in").notNull().default(false),
  currentZoneId: integer("current_zone_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFanSchema = createInsertSchema(fansTable).omit({ id: true, createdAt: true });
export type InsertFan = z.infer<typeof insertFanSchema>;
export type Fan = typeof fansTable.$inferSelect;
