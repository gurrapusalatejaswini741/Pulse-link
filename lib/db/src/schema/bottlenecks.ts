import { pgTable, text, serial, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const bottlenecksTable = pgTable("bottlenecks", {
  id: serial("id").primaryKey(),
  zoneId: integer("zone_id").notNull(),
  zoneName: text("zone_name").notNull(),
  severity: text("severity").notNull().default("medium"),
  density: real("density").notNull(),
  detectedAt: timestamp("detected_at", { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

export const insertBottleneckSchema = createInsertSchema(bottlenecksTable).omit({ id: true });
export type InsertBottleneck = z.infer<typeof insertBottleneckSchema>;
export type Bottleneck = typeof bottlenecksTable.$inferSelect;
