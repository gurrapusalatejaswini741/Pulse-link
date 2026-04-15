import { db, venuesTable, zonesTable, fansTable, notificationsTable } from "@workspace/db";

async function seed() {
  console.log("Seeding Pulse-Link database...");

  const existingVenues = await db.select().from(venuesTable);
  if (existingVenues.length > 0) {
    console.log("Data already seeded, skipping.");
    process.exit(0);
  }

  const [venue] = await db.insert(venuesTable).values({
    name: "Apex Arena",
    totalCapacity: 50000,
    gridRows: 6,
    gridCols: 8,
  }).returning();

  console.log(`Created venue: ${venue.name}`);

  const zoneDefinitions = [
    { name: "Gate 1 - North Main", type: "gate", gridRow: 0, gridCol: 0, capacity: 500 },
    { name: "Gate 2 - North East", type: "gate", gridRow: 0, gridCol: 2, capacity: 400 },
    { name: "Gate 3 - East", type: "gate", gridRow: 0, gridCol: 4, capacity: 400 },
    { name: "Gate 4 - South East", type: "gate", gridRow: 0, gridCol: 6, capacity: 350 },
    { name: "North Concessions A", type: "concession", gridRow: 1, gridCol: 1, capacity: 150 },
    { name: "North Concessions B", type: "concession", gridRow: 1, gridCol: 3, capacity: 150 },
    { name: "South Concessions A", type: "concession", gridRow: 1, gridCol: 5, capacity: 150 },
    { name: "Express Kiosk C", type: "concession", gridRow: 1, gridCol: 7, capacity: 80 },
    { name: "Main Restrooms North", type: "restroom", gridRow: 2, gridCol: 0, capacity: 120 },
    { name: "Main Restrooms East", type: "restroom", gridRow: 2, gridCol: 3, capacity: 120 },
    { name: "Family Restrooms", type: "restroom", gridRow: 2, gridCol: 6, capacity: 80 },
    { name: "Main Corridor", type: "general", gridRow: 2, gridCol: 4, capacity: 800 },
    { name: "Section A - North Lower", type: "seating", gridRow: 3, gridCol: 0, capacity: 2000 },
    { name: "Section B - North Upper", type: "seating", gridRow: 3, gridCol: 2, capacity: 2500 },
    { name: "Section C - South Lower", type: "seating", gridRow: 3, gridCol: 4, capacity: 2000 },
    { name: "Section D - South Upper", type: "seating", gridRow: 3, gridCol: 6, capacity: 2500 },
    { name: "Section E - East Stand", type: "seating", gridRow: 4, gridCol: 1, capacity: 3000 },
    { name: "Section F - West Stand", type: "seating", gridRow: 4, gridCol: 5, capacity: 3000 },
    { name: "VIP Lounge", type: "general", gridRow: 4, gridCol: 3, capacity: 200 },
    { name: "Medical Station", type: "general", gridRow: 5, gridCol: 7, capacity: 50 },
    { name: "Security Checkpoint 1", type: "gate", gridRow: 5, gridCol: 0, capacity: 200 },
    { name: "Security Checkpoint 2", type: "gate", gridRow: 5, gridCol: 4, capacity: 200 },
    { name: "Merchandise Stand", type: "concession", gridRow: 4, gridCol: 7, capacity: 100 },
    { name: "West Concourse", type: "general", gridRow: 5, gridCol: 2, capacity: 600 },
  ];

  for (const zone of zoneDefinitions) {
    const density = zone.type === "seating" ? 0.65 + Math.random() * 0.25
      : zone.type === "gate" ? 0.15 + Math.random() * 0.20
      : zone.type === "concession" ? 0.25 + Math.random() * 0.35
      : 0.10 + Math.random() * 0.20;

    await db.insert(zonesTable).values({
      ...zone,
      currentCount: Math.round(density * zone.capacity),
      density,
      isBottleneck: density > 0.75,
    });
  }

  console.log(`Created ${zoneDefinitions.length} zones`);

  const fanNames = [
    "Alex Rivera", "Jordan Chen", "Sam Patel", "Morgan Williams",
    "Casey Thompson", "Drew Martinez", "Taylor Kim", "Reese Johnson",
  ];

  for (let i = 0; i < fanNames.length; i++) {
    const sections = ["A", "B", "C", "D", "E", "F"];
    const section = sections[i % sections.length];
    await db.insert(fansTable).values({
      name: fanNames[i],
      email: `fan${i + 1}@pulselink.app`,
      seatSection: `Section ${section}`,
      checkedIn: i < 5,
    });
  }

  console.log("Created 8 fans");

  await db.insert(notificationsTable).values([
    {
      type: "nudge",
      title: "Shorter Line Alert",
      message: "North Concessions B has a 3-minute wait. Skip the main line and save time!",
      zoneId: 6,
      discountCode: "QUICK10",
      discountPercent: 10,
      dismissed: false,
    },
    {
      type: "alert",
      title: "Gate 1 Congested",
      message: "Gate 1 North is at 87% capacity. Use Gate 3 East for faster entry.",
      zoneId: 1,
      dismissed: false,
    },
    {
      type: "nudge",
      title: "Express Kiosk Deal",
      message: "Express Kiosk C is nearly empty. Get 10% off any beverage right now!",
      zoneId: 8,
      discountCode: "EXPRESS10",
      discountPercent: 10,
      dismissed: false,
    },
  ]);

  console.log("Created notifications");
  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
