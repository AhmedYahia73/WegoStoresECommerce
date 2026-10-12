"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllAdmin = getAllAdmin;
exports.getAdminById = getAdminById;
exports.createAdmin = createAdmin;
exports.updateAdmin = updateAdmin;
exports.deleteAdmin = deleteAdmin;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const bcrypt_1 = __importDefault(require("bcrypt"));
const Errors_1 = require("../../Errors");
const response_1 = require("../../utils/response");
// 1. Get All Admins
async function getAllAdmin(req, res) {
    const allAdmins = await db_1.db
        .select({
        id: schema_1.admins.id,
        name: schema_1.admins.name,
        email: schema_1.admins.email,
        createdAt: schema_1.admins.createdAt,
        updatedAt: schema_1.admins.updatedAt,
    })
        .from(schema_1.admins);
    return (0, response_1.SuccessResponse)(res, { admins: allAdmins }, 200);
}
// 2. Get Admin By ID
async function getAdminById(req, res) {
    const { id } = req.params;
    const admin = await db_1.db
        .select({
        id: schema_1.admins.id,
        name: schema_1.admins.name,
        email: schema_1.admins.email,
        createdAt: schema_1.admins.createdAt,
        updatedAt: schema_1.admins.updatedAt,
    })
        .from(schema_1.admins)
        .where((0, drizzle_orm_1.eq)(schema_1.admins.id, id))
        .limit(1);
    if (!admin[0]) {
        throw new Errors_1.NotFound("Admin not found");
    }
    return (0, response_1.SuccessResponse)(res, { admin: admin[0] }, 200);
}
// 3. Create Admin
async function createAdmin(req, res) {
    const { name, email, password } = req.body;
    const existingAdmin = await db_1.db
        .select({ id: schema_1.admins.id })
        .from(schema_1.admins)
        .where((0, drizzle_orm_1.eq)(schema_1.admins.email, email))
        .limit(1);
    if (existingAdmin[0]) {
        throw new Errors_1.ConflictError("Email already exists");
    }
    const hashedPassword = await bcrypt_1.default.hash(password, 10);
    await db_1.db.insert(schema_1.admins).values({
        name,
        email,
        password: hashedPassword,
    });
    return (0, response_1.SuccessResponse)(res, { message: "Admin created successfully" }, 201);
}
// 4. Update Admin
async function updateAdmin(req, res) {
    const { id } = req.params;
    const { name, email, password } = req.body;
    const existingAdmin = await db_1.db
        .select()
        .from(schema_1.admins)
        .where((0, drizzle_orm_1.eq)(schema_1.admins.id, id))
        .limit(1);
    if (!existingAdmin[0]) {
        throw new Errors_1.NotFound("Admin not found");
    }
    if (email && email !== existingAdmin[0].email) {
        const emailTaken = await db_1.db
            .select({ id: schema_1.admins.id })
            .from(schema_1.admins)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.admins.email, email), (0, drizzle_orm_1.ne)(schema_1.admins.id, id)))
            .limit(1);
        if (emailTaken[0]) {
            throw new Errors_1.ConflictError("Email already exists");
        }
    }
    const updateData = {};
    if (name !== undefined)
        updateData.name = name;
    if (email !== undefined)
        updateData.email = email;
    if (password !== undefined) {
        updateData.password = await bcrypt_1.default.hash(password, 10);
    }
    if (Object.keys(updateData).length > 0) {
        await db_1.db.update(schema_1.admins).set(updateData).where((0, drizzle_orm_1.eq)(schema_1.admins.id, id));
    }
    return (0, response_1.SuccessResponse)(res, { message: "Admin updated successfully" }, 200);
}
// 5. Delete Admin
async function deleteAdmin(req, res) {
    const { id } = req.params;
    const existingAdmin = await db_1.db
        .select({ id: schema_1.admins.id })
        .from(schema_1.admins)
        .where((0, drizzle_orm_1.eq)(schema_1.admins.id, id))
        .limit(1);
    if (!existingAdmin[0]) {
        throw new Errors_1.NotFound("Admin not found");
    }
    await db_1.db.delete(schema_1.admins).where((0, drizzle_orm_1.eq)(schema_1.admins.id, id));
    return (0, response_1.SuccessResponse)(res, { message: "Admin deleted successfully" }, 200);
}
