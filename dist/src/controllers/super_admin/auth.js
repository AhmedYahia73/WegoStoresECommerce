"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginAdmin = loginAdmin;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const bcrypt_1 = __importDefault(require("bcrypt"));
const auth_1 = require("../../utils/auth");
const Errors_1 = require("../../Errors");
const response_1 = require("../../utils/response");
async function loginAdmin(req, res) {
    const { email, password } = req.body;
    const admin = await db_1.db
        .select()
        .from(schema_1.admins)
        .where((0, drizzle_orm_1.eq)(schema_1.admins.email, email))
        .limit(1);
    if (!admin[0]) {
        throw new Errors_1.UnauthorizedError("Invalid email or password");
    }
    const match = await bcrypt_1.default.compare(password, admin[0].password);
    if (!match) {
        throw new Errors_1.UnauthorizedError("Invalid email or password");
    }
    const token = (0, auth_1.generateAdminToken)({
        id: admin[0].id,
        name: admin[0].name,
        email: admin[0].email,
    });
    return (0, response_1.SuccessResponse)(res, {
        message: "Login successful",
        token,
        admin: {
            id: admin[0].id,
            name: admin[0].name,
            email: admin[0].email,
        },
    }, 200);
}
