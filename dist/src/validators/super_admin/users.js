"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userIdParamSchema = exports.updateUserSchema = exports.createUserSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.createUserSchema = zod_1.default.object({
    body: zod_1.default.object({
        name: zod_1.default
            .string({ required_error: "Name is required" })
            .min(1, "Name is required"),
        email: zod_1.default
            .string({ required_error: "Email is required" })
            .email("Invalid email"),
        subdomain: zod_1.default
            .string({ required_error: "Subdomain is required" })
            .min(1, "Subdomain is required"),
        phone: zod_1.default
            .string({ required_error: "Phone is required" })
            .min(1, "Phone is required"),
        password: zod_1.default
            .string({ required_error: "Password is required" })
            .min(6, "Password must be at least 6 characters long"),
    }),
});
exports.updateUserSchema = zod_1.default.object({
    params: zod_1.default.object({
        id: zod_1.default
            .string({ required_error: "User ID is required" })
            .uuid("Invalid user ID"),
    }),
    body: zod_1.default.object({
        name: zod_1.default.string().min(1, "Name cannot be empty").optional(),
        email: zod_1.default.string().email("Invalid email").optional(),
        subdomain: zod_1.default.string().min(1, "Subdomain cannot be empty").optional(),
        phone: zod_1.default.string().min(1, "Phone cannot be empty").optional(),
        password: zod_1.default
            .string()
            .min(6, "Password must be at least 6 characters long")
            .optional(),
    }),
});
exports.userIdParamSchema = zod_1.default.object({
    params: zod_1.default.object({
        id: zod_1.default
            .string({ required_error: "User ID is required" })
            .uuid("Invalid user ID"),
    }),
});
