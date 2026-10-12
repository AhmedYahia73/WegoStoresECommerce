"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkOnlyAdmin = void 0;
const db_1 = require("../models/db");
const schema_1 = require("../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const Errors_1 = require("../Errors");
// ✅ Middleware للتحقق من تسجيل الدخول في جدول admins (Super Admin)
const checkOnlyAdmin = () => {
    return async (req, res, next) => {
        try {
            const user = req.user;
            if (!user) {
                throw new Errors_1.UnauthorizedError("Authentication required");
            }
            if (user.role !== "admin") {
                throw new Errors_1.ForbiddenError("You must login as Admin");
            }
            const existingAdmin = await db_1.db
                .select({ id: schema_1.admins.id })
                .from(schema_1.admins)
                .where((0, drizzle_orm_1.eq)(schema_1.admins.id, user.id))
                .limit(1);
            if (!existingAdmin[0]) {
                throw new Errors_1.ForbiddenError("You must login as Admin");
            }
            return next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.checkOnlyAdmin = checkOnlyAdmin;
