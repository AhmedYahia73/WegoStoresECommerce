"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.discountIdParamSchema = exports.updateDiscountSchema = exports.createDiscountSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const multilingualNameSchema = zod_1.default
    .record(zod_1.default.string(), zod_1.default.string({ required_error: "Language translation must be a string" }))
    .refine((obj) => Object.keys(obj).length > 0 && Object.values(obj).some((v) => v.trim().length > 0), { message: "At least one language is required for name" });
exports.createDiscountSchema = zod_1.default.object({
    body: zod_1.default.object({
        name: multilingualNameSchema,
        amount: zod_1.default.union([zod_1.default.number(), zod_1.default.string().regex(/^\d+(\.\d{1,2})?$/)], {
            required_error: "Amount is required",
        }),
        type: zod_1.default.enum(["percentage", "value"], {
            required_error: "Type is required (percentage or value)",
        }),
        start_date: zod_1.default
            .string({ required_error: "Start date is required" })
            .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format"),
        end_date: zod_1.default
            .string({ required_error: "End date is required" })
            .regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format"),
    }),
});
exports.updateDiscountSchema = zod_1.default.object({
    params: zod_1.default.object({
        id: zod_1.default.string({ required_error: "Discount ID is required" }).uuid("Invalid discount ID"),
    }),
    body: zod_1.default.object({
        name: multilingualNameSchema.optional(),
        amount: zod_1.default.union([zod_1.default.number(), zod_1.default.string().regex(/^\d+(\.\d{1,2})?$/)]).optional(),
        type: zod_1.default.enum(["percentage", "value"]).optional(),
        start_date: zod_1.default
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format")
            .optional(),
        end_date: zod_1.default
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format")
            .optional(),
    }),
});
exports.discountIdParamSchema = zod_1.default.object({
    params: zod_1.default.object({
        id: zod_1.default.string({ required_error: "Discount ID is required" }).uuid("Invalid discount ID"),
    }),
});
