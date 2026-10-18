"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userOrderIdParamSchema = exports.changeUserOrderStatusSchema = exports.createUserOrderSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.createUserOrderSchema = zod_1.default.object({
    body: zod_1.default.object({
        package_id: zod_1.default.string({ required_error: "Package ID is required" }).uuid("Invalid package ID"),
        discount_id: zod_1.default.string().uuid("Invalid discount ID").optional().nullable(),
        price: zod_1.default.union([zod_1.default.number(), zod_1.default.string().regex(/^\d+(\.\d{1,2})?$/)], {
            required_error: "Price is required",
        }),
        discount: zod_1.default
            .union([zod_1.default.number(), zod_1.default.string().regex(/^\d+(\.\d{1,2})?$/)])
            .optional()
            .default(0),
        final_price: zod_1.default.union([zod_1.default.number(), zod_1.default.string().regex(/^\d+(\.\d{1,2})?$/)], {
            required_error: "Final price is required",
        }),
        user_id: zod_1.default.string({ required_error: "User ID is required" }).uuid("Invalid user ID"),
    }),
});
exports.changeUserOrderStatusSchema = zod_1.default.object({
    params: zod_1.default.object({
        id: zod_1.default.string({ required_error: "Order ID is required" }).uuid("Invalid order ID"),
    }),
    body: zod_1.default
        .object({
        status: zod_1.default.enum(["approve", "reject"], {
            required_error: "Status must be either 'approve' or 'reject'",
        }),
        reject_reason: zod_1.default.string().optional().nullable(),
    })
        .refine((data) => {
        if (data.status === "reject") {
            return !!data.reject_reason && data.reject_reason.trim().length > 0;
        }
        return true;
    }, {
        message: "reject_reason is required when rejecting an order",
        path: ["reject_reason"],
    }),
});
exports.userOrderIdParamSchema = zod_1.default.object({
    params: zod_1.default.object({
        id: zod_1.default.string({ required_error: "Order ID is required" }).uuid("Invalid order ID"),
    }),
});
