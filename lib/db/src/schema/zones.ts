import { pgTable, text, serial, integer, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const zonesTable = pgTable("zones", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull().default("general"),
  gridRow: integer("grid_row").notNull(),
  gridCol: integer("grid_col").notNull(),
  capacity: integer("capacity").notNull().default(200),
  currentCount: integer("current_count").notNull().default(0),
  density: real("density").notNull().default(0),
  isBottleneck: boolean("is_bottleneck").notNull().default(false),
});

export const insertZoneSchema = createInsertSchema(zonesTable).omit({ id: true });
export type InsertZone = z.infer<typeof insertZoneSchema>;
export type Zone = typeof zonesTable.$inferSelect;
