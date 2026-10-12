"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminLoginSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.adminLoginSchema = zod_1.default.object({
    body: zod_1.default.object({
        email: zod_1.default
            .string({ required_error: "Email is required" })
            .email("Invalid email"),
        password: zod_1.default
            .string({ required_error: "Password is required" })
            .min(6, "Password must be at least 6 characters long"),
    }),
});
