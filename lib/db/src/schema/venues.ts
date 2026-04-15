import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const venuesTable = pgTable("venues", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  totalCapacity: integer("total_capacity").notNull().default(50000),
  gridRows: integer("grid_rows").notNull().default(6),
  gridCols: integer("grid_cols").notNull().default(8),
});

export const insertVenueSchema = createInsertSchema(venuesTable).omit({ id: true });
export type InsertVenue = z.infer<typeof insertVenueSchema>;
export type Venue = typeof venuesTable.$inferSelect;
