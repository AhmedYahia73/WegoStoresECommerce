"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrdersSummarySchema = void 0;
const zod_1 = __importDefault(require("zod"));
const emptyToUndefined = (val) => {
    if (val === undefined || val === null)
        return undefined;
    if (typeof val === "string") {
        const trimmed = val.trim();
        if (trimmed === "" || trimmed.toLowerCase() === "null")
            return undefined;
        return trimmed;
    }
    return val;
};
exports.getOrdersSummarySchema = zod_1.default.object({
    query: zod_1.default.object({
        user_id: zod_1.default.preprocess(emptyToUndefined, zod_1.default.string().uuid("Invalid user_id").optional()),
        from: zod_1.default.preprocess(emptyToUndefined, zod_1.default
            .string()
            .refine((val) => !Number.isNaN(new Date(val).getTime()), {
            message: "Invalid 'from' date",
        })
            .optional()),
        to: zod_1.default.preprocess(emptyToUndefined, zod_1.default
            .string()
            .refine((val) => !Number.isNaN(new Date(val).getTime()), {
            message: "Invalid 'to' date",
        })
            .optional()),
        page: zod_1.default.preprocess(emptyToUndefined, zod_1.default.string().optional()),
        limit: zod_1.default.preprocess(emptyToUndefined, zod_1.default.string().optional()),
    }),
});
