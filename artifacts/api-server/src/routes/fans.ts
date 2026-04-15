import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, fansTable, zonesTable } from "@workspace/db";
import { CreateFanBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/fans", async (req, res): Promise<void> => {
  const fans = await db.select().from(fansTable).orderBy(fansTable.id);
  res.json(fans);
});

router.post("/fans", async (req, res): Promise<void> => {
  const parsed = CreateFanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [fan] = await db.insert(fansTable).values(parsed.data).returning();
  res.status(201).json(fan);
});

router.get("/fans/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid fan ID" });
    return;
  }
  const [fan] = await db.select().from(fansTable).where(eq(fansTable.id, id));
  if (!fan) {
    res.status(404).json({ error: "Fan not found" });
    return;
  }
  res.json(fan);
});

router.get("/fans/:id/navigate", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const destination = req.query.destination as string;

  if (isNaN(id) || !destination) {
    res.status(400).json({ error: "Invalid fan ID or missing destination" });
    return;
  }

  const zones = await db.select().from(zonesTable);
  const uncrowdedZones = zones.filter(z => z.density < 0.6);
  const hotZones = zones.filter(z => z.isBottleneck);

  const pathZones = uncrowdedZones.slice(0, 3).map(z => z.name);
  const hasDiscount = hotZones.some(z => z.type === "concession");

  res.json({
    destination,
    currentZone: "Section A Entrance",
    recommendedPath: pathZones.length > 0
      ? ["Your Location", ...pathZones, destination]
      : ["Your Location", "Main Corridor", destination],
    estimatedMinutes: Math.floor(Math.random() * 5) + 2,
    congestionLevel: hotZones.length > 3 ? "high" : hotZones.length > 1 ? "medium" : "low",
    alternativeAvailable: hotZones.length > 0,
    discountOffer: hasDiscount ? "10% off at Section C Concessions — only 2 people in line!" : null,
  });
});

export default router;
