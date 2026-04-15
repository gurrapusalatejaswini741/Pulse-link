import { db, zonesTable, bottlenecksTable } from "@workspace/db";
import { eq, isNull } from "drizzle-orm";
import { logger } from "./logger";

const BOTTLENECK_THRESHOLD = 0.75;
const CRITICAL_THRESHOLD = 0.90;

export type SimulationMode = "normal" | "halftime" | "postgame";

let simulationMode: SimulationMode = "normal";
let simulationInterval: ReturnType<typeof setInterval> | null = null;

function getSeverity(density: number): string {
  if (density >= CRITICAL_THRESHOLD) return "critical";
  if (density >= 0.85) return "high";
  if (density >= BOTTLENECK_THRESHOLD) return "medium";
  return "low";
}

function getHalftimeDistribution(zoneType: string): number {
  switch (zoneType) {
    case "concession": return 0.85 + Math.random() * 0.15;
    case "restroom": return 0.80 + Math.random() * 0.18;
    case "gate": return 0.45 + Math.random() * 0.25;
    case "seating": return 0.10 + Math.random() * 0.20;
    default: return 0.30 + Math.random() * 0.30;
  }
}

function getNormalDistribution(zoneType: string): number {
  switch (zoneType) {
    case "concession": return 0.20 + Math.random() * 0.40;
    case "restroom": return 0.15 + Math.random() * 0.30;
    case "gate": return 0.10 + Math.random() * 0.20;
    case "seating": return 0.60 + Math.random() * 0.30;
    default: return 0.20 + Math.random() * 0.30;
  }
}

export async function tickSimulation(): Promise<void> {
  try {
    const zones = await db.select().from(zonesTable);

    for (const zone of zones) {
      let targetDensity: number;

      if (simulationMode === "halftime") {
        targetDensity = getHalftimeDistribution(zone.type);
      } else {
        targetDensity = getNormalDistribution(zone.type);
      }

      const drift = (targetDensity - zone.density) * 0.3 + (Math.random() - 0.5) * 0.05;
      const newDensity = Math.max(0, Math.min(1, zone.density + drift));
      const newCount = Math.round(newDensity * zone.capacity);
      const isBottleneck = newDensity >= BOTTLENECK_THRESHOLD;

      await db.update(zonesTable).set({
        density: newDensity,
        currentCount: newCount,
        isBottleneck,
      }).where(eq(zonesTable.id, zone.id));

      if (isBottleneck && !zone.isBottleneck) {
        await db.insert(bottlenecksTable).values({
          zoneId: zone.id,
          zoneName: zone.name,
          severity: getSeverity(newDensity),
          density: newDensity,
        });
      } else if (!isBottleneck && zone.isBottleneck) {
        const unresolved = await db.select().from(bottlenecksTable)
          .where(eq(bottlenecksTable.zoneId, zone.id));
        for (const b of unresolved) {
          if (!b.resolvedAt) {
            await db.update(bottlenecksTable)
              .set({ resolvedAt: new Date() })
              .where(eq(bottlenecksTable.id, b.id));
          }
        }
      }
    }
  } catch (err) {
    logger.error({ err }, "Crowd simulation tick failed");
  }
}

export function getSimulationMode(): SimulationMode {
  return simulationMode;
}

export function setSimulationMode(mode: SimulationMode): void {
  simulationMode = mode;
  logger.info({ mode }, "Simulation mode changed");
}

export function startSimulation(): void {
  if (simulationInterval) return;
  simulationInterval = setInterval(tickSimulation, 2000);
  logger.info("Crowd simulation started");
}

export function stopSimulation(): void {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
}
