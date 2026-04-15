import { Router, type IRouter } from "express";
import { db, checkinsTable, fansTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateCheckinBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/checkins", async (req, res): Promise<void> => {
  const checkins = await db.select().from(checkinsTable)
    .orderBy(checkinsTable.checkedInAt);
  res.json(checkins);
});

router.post("/checkins", async (req, res): Promise<void> => {
  const parsed = CreateCheckinBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [fan] = await db.select().from(fansTable).where(eq(fansTable.id, parsed.data.fanId));
  const fanName = fan?.name ?? "Unknown Fan";

  const [checkin] = await db.insert(checkinsTable).values({
    fanId: parsed.data.fanId,
    fanName,
    gateId: parsed.data.gateId,
    status: "success",
    verificationMethod: parsed.data.verificationMethod,
  }).returning();

  if (fan) {
    await db.update(fansTable).set({ checkedIn: true }).where(eq(fansTable.id, fan.id));
  }

  res.status(201).json(checkin);
});

export default router;
