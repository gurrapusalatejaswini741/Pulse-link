import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, notificationsTable } from "@workspace/db";
import { CreateNotificationBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/notifications", async (req, res): Promise<void> => {
  const notifications = await db.select().from(notificationsTable)
    .orderBy(notificationsTable.createdAt);
  res.json(notifications);
});

router.post("/notifications", async (req, res): Promise<void> => {
  const parsed = CreateNotificationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [notification] = await db.insert(notificationsTable).values(parsed.data).returning();
  res.status(201).json(notification);
});

router.post("/notifications/:id/dismiss", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid notification ID" });
    return;
  }
  const [notification] = await db.update(notificationsTable)
    .set({ dismissed: true })
    .where(eq(notificationsTable.id, id))
    .returning();
  if (!notification) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }
  res.json(notification);
});

export default router;
