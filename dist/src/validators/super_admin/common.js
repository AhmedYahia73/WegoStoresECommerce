"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkDeleteSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.bulkDeleteSchema = zod_1.default.object({
    body: zod_1.default.object({
        ids: zod_1.default
            .array(zod_1.default.string().min(1, "ID cannot be empty"), {
            required_error: "Array of IDs is required",
        })
            .min(1, "At least one ID must be provided"),
    }),
});
