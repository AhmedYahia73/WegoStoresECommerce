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
const nullableOrdersLimitSchema = zod_1.default
    .union([
    zod_1.default.number().int("Must be an integer").min(0, "Must be >= 0"),
    zod_1.default.string().regex(/^\d+$/, "Must be a non-negative integer").transform(Number),
])
    .nullable();
exports.createPackageSchema = zod_1.default.object({
    body: zod_1.default
        .object({
        name: multilingualNameSchema,
        price: zod_1.default.union([zod_1.default.number().nonnegative(), zod_1.default.string().regex(/^\d+(\.\d{1,2})?$/)], {
            required_error: "Price is required",
        }),
        orders_from: zod_1.default.coerce
            .number({ required_error: "orders_from is required" })
            .int("orders_from must be an integer")
            .min(0, "orders_from must be >= 0"),
        orders_to: nullableOrdersLimitSchema.optional().default(null),
        sort: zod_1.default.coerce
            .number({ required_error: "sort is required" })
            .int("sort must be an integer")
            .min(0, "sort must be >= 0"),
    })
        .refine((data) => data.orders_to === null || data.orders_to === undefined || data.orders_to >= data.orders_from, {
        message: "orders_to must be greater than or equal to orders_from",
        path: ["orders_to"],
    }),
});
exports.updatePackageSchema = zod_1.default.object({
    params: zod_1.default.object({
        id: zod_1.default.string({ required_error: "Package ID is required" }).uuid("Invalid package ID"),
    }),
    body: zod_1.default
        .object({
        name: multilingualNameSchema.optional(),
        price: zod_1.default.union([zod_1.default.number().nonnegative(), zod_1.default.string().regex(/^\d+(\.\d{1,2})?$/)]).optional(),
        orders_from: zod_1.default.coerce
            .number()
            .int("orders_from must be an integer")
            .min(0, "orders_from must be >= 0")
            .optional(),
        orders_to: nullableOrdersLimitSchema.optional(),
        sort: zod_1.default.coerce
            .number()
            .int("sort must be an integer")
            .min(0, "sort must be >= 0")
            .optional(),
    })
        .refine((data) => data.orders_from !== undefined && data.orders_to !== undefined && data.orders_to !== null
        ? data.orders_to >= data.orders_from
        : true, {
        message: "orders_to must be greater than or equal to orders_from",
        path: ["orders_to"],
    }),
});
exports.packageIdParamSchema = zod_1.default.object({
    params: zod_1.default.object({
        id: zod_1.default.string({ required_error: "Package ID is required" }).uuid("Invalid package ID"),
    }),
});
