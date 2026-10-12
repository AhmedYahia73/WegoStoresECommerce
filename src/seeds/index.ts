import { Seed } from "./runner";

// Auto-discover and register all seed files
// Import all seed files in order
import adminSeeder from "./data/01_admin";
import targetsSeeder from "./data/02_default_targets";
import visitsSeeder from "./data/03_default_visits";
import statusSeeder from "./data/04_default_visit_status";
import wishListSeeder from "./data/05_default_wishlist";

// Export all seeds in execution order
export const seeds: Seed[] = [ 
  targetsSeeder,
  adminSeeder, 
  statusSeeder,
  visitsSeeder,
  wishListSeeder,
];

// Run seeds when this file is executed directly
import { runSeeds } from "./runner";

const isFresh = process.argv.includes("--fresh");

runSeeds(seeds, { fresh: isFresh })
  .then(() => {
    console.log("✅ Seeding completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  });
