import { Seed } from "./runner";

// Import all seed files in order
import adminSeeder from "./data/01_admin";

// Export all seeds in execution order
export const seeds: Seed[] = [
  adminSeeder,
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
