"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertSettingsSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.upsertSettingsSchema = zod_1.default.object({
    body: zod_1.default.object({
        perimission_days: zod_1.default.preprocess((val) => (typeof val === "string" && val.trim() !== "" ? Number(val) : val), zod_1.default
            .number({
            required_error: "perimission_days is required",
            invalid_type_error: "perimission_days must be a number",
        })
            .int("perimission_days must be an integer")
            .min(0, "perimission_days must be 0 or greater")),
    }),
});
