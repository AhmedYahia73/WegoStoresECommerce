"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentMethodIdParamSchema = exports.updatePaymentMethodSchema = exports.createPaymentMethodSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.createPaymentMethodSchema = zod_1.default.object({
    body: zod_1.default.object({
        name: zod_1.default
            .string({ required_error: "Name is required" })
            .min(1, "Name is required"),
        icon: zod_1.default
            .string({ required_error: "Icon image is required" })
            .min(1, "Icon image is required"),
        description: zod_1.default.string().optional().nullable(),
        status: zod_1.default.boolean().optional(),
    }),
});
exports.updatePaymentMethodSchema = zod_1.default.object({
    params: zod_1.default.object({
        id: zod_1.default
            .string({ required_error: "Payment method ID is required" })
            .uuid("Invalid payment method ID"),
    }),
    body: zod_1.default.object({
        name: zod_1.default.string().min(1, "Name cannot be empty").optional(),
        icon: zod_1.default.string().min(1, "Icon cannot be empty").optional(),
        description: zod_1.default.string().optional().nullable(),
        status: zod_1.default.boolean().optional(),
    }),
});
exports.paymentMethodIdParamSchema = zod_1.default.object({
    params: zod_1.default.object({
        id: zod_1.default
            .string({ required_error: "Payment method ID is required" })
            .uuid("Invalid payment method ID"),
    }),
});
