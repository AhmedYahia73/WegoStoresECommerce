"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.generateUserToken = exports.generateAdminToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Errors_1 = require("../Errors");
require("dotenv/config");
const JWT_SECRET = process.env.JWT_SECRET;
// ✅ للـ Super Admin (من جدول admins)
const generateAdminToken = (data) => {
    const payload = {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: "admin",
    };
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};
exports.generateAdminToken = generateAdminToken;
// ✅ للـ User / Tenant (من جدول users)
const generateUserToken = (data) => {
    const payload = {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
    };
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};
exports.generateUserToken = generateUserToken;
// 🛡️ التحقق من صحة الـ Token وفك تشفيره
const verifyToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch (error) {
        throw new Errors_1.UnauthorizedError("Invalid token");
    }
};
exports.verifyToken = verifyToken;
