"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seeds = void 0;
// Import all seed files in order
const _01_admin_1 = __importDefault(require("./data/01_admin"));
// Export all seeds in execution order
exports.seeds = [
    _01_admin_1.default,
];
// Run seeds when this file is executed directly
const runner_1 = require("./runner");
const isFresh = process.argv.includes("--fresh");
(0, runner_1.runSeeds)(exports.seeds, { fresh: isFresh })
    .then(() => {
    console.log("✅ Seeding completed successfully!");
    process.exit(0);
})
    .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
});
