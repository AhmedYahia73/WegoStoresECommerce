"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminIdParamSchema = exports.updateAdminSchema = exports.createAdminSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.createAdminSchema = zod_1.default.object({
    body: zod_1.default.object({
        name: zod_1.default.string({ required_error: "Name is required" }).min(1, "Name is required"),
        email: zod_1.default.string({ required_error: "Email is required" }).email("Invalid email"),
        password: zod_1.default
            .string({ required_error: "Password is required" })
            .min(6, "Password must be at least 6 characters long"),
    }),
});
exports.updateAdminSchema = zod_1.default.object({
    params: zod_1.default.object({
        id: zod_1.default.string({ required_error: "Admin ID is required" }).uuid("Invalid admin ID"),
    }),
    body: zod_1.default.object({
        name: zod_1.default.string().min(1, "Name cannot be empty").optional(),
        email: zod_1.default.string().email("Invalid email").optional(),
        password: zod_1.default.string().min(6, "Password must be at least 6 characters long").optional(),
    }),
});
exports.adminIdParamSchema = zod_1.default.object({
    params: zod_1.default.object({
        id: zod_1.default.string({ required_error: "Admin ID is required" }).uuid("Invalid admin ID"),
    }),
});
