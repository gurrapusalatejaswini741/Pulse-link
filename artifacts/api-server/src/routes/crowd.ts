import { Router, type IRouter } from "express";
import { eq, isNull } from "drizzle-orm";
import { db, zonesTable, bottlenecksTable } from "@workspace/db";
import { tickSimulation, getSimulationMode, setSimulationMode } from "../lib/crowd-engine";

const router: IRouter = Router();

router.get("/crowd/state", async (req, res): Promise<void> => {
  const zones = await db.select().from(zonesTable);
  const activeBottlenecks = zones.filter(z => z.isBottleneck).length;
  const totalFans = zones.reduce((sum, z) => sum + z.currentCount, 0);

  res.json({
    zones,
    totalFans,
    activeBottlenecks,
    simulationMode: getSimulationMode(),
    timestamp: new Date().toISOString(),
  });
});

router.post("/crowd/simulate-halftime", async (req, res): Promise<void> => {
  setSimulationMode("halftime");
  for (let i = 0; i < 3; i++) {
    await tickSimulation();
  }
  res.json({
    success: true,
    message: "Halftime surge simulation triggered — 1,000 virtual fans heading to concessions and restrooms",
    mode: "halftime",
  });
});

router.post("/crowd/reset", async (req, res): Promise<void> => {
  setSimulationMode("normal");
  await tickSimulation();
  res.json({
    success: true,
    message: "Simulation reset to normal distribution",
    mode: "normal",
  });
});

router.get("/crowd/zones", async (req, res): Promise<void> => {
  const zones = await db.select().from(zonesTable);
  res.json(zones);
});

router.get("/crowd/zones/:zoneId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.zoneId) ? req.params.zoneId[0] : req.params.zoneId;
  const zoneId = parseInt(raw, 10);
  if (isNaN(zoneId)) {
    res.status(400).json({ error: "Invalid zone ID" });
    return;
  }
  const [zone] = await db.select().from(zonesTable).where(eq(zonesTable.id, zoneId));
  if (!zone) {
    res.status(404).json({ error: "Zone not found" });
    return;
  }
  res.json(zone);
});

router.get("/crowd/bottlenecks", async (req, res): Promise<void> => {
  const bottlenecks = await db.select().from(bottlenecksTable)
    .where(isNull(bottlenecksTable.resolvedAt))
    .orderBy(bottlenecksTable.detectedAt);
  res.json(bottlenecks);
});

router.get("/crowd/stats", async (req, res): Promise<void> => {
  const zones = await db.select().from(zonesTable);
  const activeBottlenecks = zones.filter(z => z.isBottleneck).length;
  const totalFans = zones.reduce((sum, z) => sum + z.currentCount, 0);
  const avgDensity = zones.length > 0
    ? zones.reduce((sum, z) => sum + z.density, 0) / zones.length
    : 0;
  const sortedZones = [...zones].sort((a, b) => b.density - a.density);
  const maxZone = sortedZones[0];

  res.json({
    totalFans,
    checkedInFans: Math.round(totalFans * 0.85),
    activeBottlenecks,
    averageDensity: Math.round(avgDensity * 100) / 100,
    maxDensityZone: maxZone?.name ?? "N/A",
    simulationMode: getSimulationMode(),
  });
});

export default router;
