"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUpdatePaymobSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const multilingualNameSchema = zod_1.default.union([
    zod_1.default.string().min(1, "Name is required").transform((val) => ({ ar: val, en: val })),
    zod_1.default
        .record(zod_1.default.string(), zod_1.default.string())
        .refine((obj) => Object.keys(obj).length > 0 && Object.values(obj).some((v) => v.trim().length > 0), { message: "At least one language is required for name" }),
]);
exports.createUpdatePaymobSchema = zod_1.default.object({
    body: zod_1.default.object({
        name: multilingualNameSchema,
        logo: zod_1.default.string().min(1, "Logo image is required").optional(),
        api_key: zod_1.default.string({ required_error: "API key is required" }).min(1, "API key is required"),
        iframe_id: zod_1.default.union([zod_1.default.string().min(1, "iframe_id is required"), zod_1.default.number().transform(String)], { required_error: "iframe_id is required" }),
        integration_id: zod_1.default.union([zod_1.default.string().min(1, "integration_id is required"), zod_1.default.number().transform(String)], { required_error: "integration_id is required" }),
        hmac: zod_1.default.string({ required_error: "HMAC is required" }).min(1, "HMAC is required"),
        type: zod_1.default.enum(["test", "live"], { required_error: "Type must be test or live" }).default("test"),
        status: zod_1.default
            .preprocess((val) => (typeof val === "string" ? val === "true" || val === "1" : val), zod_1.default.boolean())
            .default(true),
        callback_url: zod_1.default.string().min(1).optional(),
    }),
});
