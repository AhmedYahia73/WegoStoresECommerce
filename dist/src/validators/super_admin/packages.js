"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.packageIdParamSchema = exports.updatePackageSchema = exports.createPackageSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const multilingualNameSchema = zod_1.default
    .record(zod_1.default.string(), zod_1.default.string({ required_error: "Language translation must be a string" }))
    .refine((obj) => Object.keys(obj).length > 0 && Object.values(obj).some((v) => v.trim().length > 0), { message: "At least one language is required for name" });
exports.createPackageSchema = zod_1.default.object({
    body: zod_1.default.object({
        name: multilingualNameSchema,
        type: zod_1.default.enum(["monthly", "quarterly", "biannual", "annual"], {
            required_error: "Package type is required (monthly, quarterly, biannual, annual)",
        }),
        price: zod_1.default.union([zod_1.default.number(), zod_1.default.string().regex(/^\d+(\.\d{1,2})?$/)], {
            required_error: "Price is required",
        }),
        status: zod_1.default.boolean().optional().default(true),
    }),
});
exports.updatePackageSchema = zod_1.default.object({
    params: zod_1.default.object({
        id: zod_1.default.string({ required_error: "Package ID is required" }).uuid("Invalid package ID"),
    }),
    body: zod_1.default.object({
        name: multilingualNameSchema.optional(),
        type: zod_1.default.enum(["monthly", "quarterly", "biannual", "annual"]).optional(),
        price: zod_1.default.union([zod_1.default.number(), zod_1.default.string().regex(/^\d+(\.\d{1,2})?$/)]).optional(),
        status: zod_1.default.boolean().optional(),
    }),
});
exports.packageIdParamSchema = zod_1.default.object({
    params: zod_1.default.object({
        id: zod_1.default.string({ required_error: "Package ID is required" }).uuid("Invalid package ID"),
    }),
});
