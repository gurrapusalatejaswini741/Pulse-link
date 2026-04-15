import { Router, type IRouter } from "express";
import { db, venuesTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/venues", async (req, res): Promise<void> => {
  const venues = await db.select().from(venuesTable);
  res.json(venues);
});

export default router;
