"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUsers = getAllUsers;
exports.getUsersSelection = getUsersSelection;
exports.getUserById = getUserById;
exports.createUser = createUser;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const bcrypt_1 = __importDefault(require("bcrypt"));
const Errors_1 = require("../../Errors");
const response_1 = require("../../utils/response");
// 1. Get All Users
async function getAllUsers(req, res) {
    const allUsers = await db_1.db
        .select({
        id: schema_1.users.id,
        name: schema_1.users.name,
        email: schema_1.users.email,
        subdomain: schema_1.users.subdomain,
        phone: schema_1.users.phone,
        createdAt: schema_1.users.createdAt,
        updatedAt: schema_1.users.updatedAt,
    })
        .from(schema_1.users);
    return (0, response_1.SuccessResponse)(res, { users: allUsers }, 200);
}
// 2. Get Users Selection (id, name) for relational dropdowns (e.g. orders.user_id)
async function getUsersSelection(req, res) {
    const list = await db_1.db
        .select({
        id: schema_1.users.id,
        name: schema_1.users.name,
    })
        .from(schema_1.users);
    return (0, response_1.SuccessResponse)(res, { users: list }, 200);
}
// 3. Get User By ID
async function getUserById(req, res) {
    const { id } = req.params;
    const user = await db_1.db
        .select({
        id: schema_1.users.id,
        name: schema_1.users.name,
        email: schema_1.users.email,
        subdomain: schema_1.users.subdomain,
        phone: schema_1.users.phone,
        createdAt: schema_1.users.createdAt,
        updatedAt: schema_1.users.updatedAt,
    })
        .from(schema_1.users)
        .where((0, drizzle_orm_1.eq)(schema_1.users.id, id))
        .limit(1);
    if (!user[0]) {
        throw new Errors_1.NotFound("User not found");
    }
    return (0, response_1.SuccessResponse)(res, { user: user[0] }, 200);
}
// 4. Create User
async function createUser(req, res) {
    const { name, email, subdomain, phone, password } = req.body;
    const existingEmail = await db_1.db
        .select({ id: schema_1.users.id })
        .from(schema_1.users)
        .where((0, drizzle_orm_1.eq)(schema_1.users.email, email))
        .limit(1);
    if (existingEmail[0]) {
        throw new Errors_1.ConflictError("Email already exists");
    }
    const existingSubdomain = await db_1.db
        .select({ id: schema_1.users.id })
        .from(schema_1.users)
        .where((0, drizzle_orm_1.eq)(schema_1.users.subdomain, subdomain))
        .limit(1);
    if (existingSubdomain[0]) {
        throw new Errors_1.ConflictError("Subdomain already exists");
    }
    const existingPhone = await db_1.db
        .select({ id: schema_1.users.id })
        .from(schema_1.users)
        .where((0, drizzle_orm_1.eq)(schema_1.users.phone, phone))
        .limit(1);
    if (existingPhone[0]) {
        throw new Errors_1.ConflictError("Phone already exists");
    }
    const hashedPassword = await bcrypt_1.default.hash(password, 10);
    await db_1.db.insert(schema_1.users).values({
        name,
        email,
        subdomain,
        phone,
        password: hashedPassword,
    });
    return (0, response_1.SuccessResponse)(res, { message: "User created successfully" }, 201);
}
// 5. Update User
async function updateUser(req, res) {
    const { id } = req.params;
    const { name, email, subdomain, phone, password } = req.body;
    const existingUser = await db_1.db
        .select()
        .from(schema_1.users)
        .where((0, drizzle_orm_1.eq)(schema_1.users.id, id))
        .limit(1);
    if (!existingUser[0]) {
        throw new Errors_1.NotFound("User not found");
    }
    if (email && email !== existingUser[0].email) {
        const emailTaken = await db_1.db
            .select({ id: schema_1.users.id })
            .from(schema_1.users)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.users.email, email), (0, drizzle_orm_1.ne)(schema_1.users.id, id)))
            .limit(1);
        if (emailTaken[0]) {
            throw new Errors_1.ConflictError("Email already exists");
        }
    }
    if (subdomain && subdomain !== existingUser[0].subdomain) {
        const subdomainTaken = await db_1.db
            .select({ id: schema_1.users.id })
            .from(schema_1.users)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.users.subdomain, subdomain), (0, drizzle_orm_1.ne)(schema_1.users.id, id)))
            .limit(1);
        if (subdomainTaken[0]) {
            throw new Errors_1.ConflictError("Subdomain already exists");
        }
    }
    if (phone && phone !== existingUser[0].phone) {
        const phoneTaken = await db_1.db
            .select({ id: schema_1.users.id })
            .from(schema_1.users)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.users.phone, phone), (0, drizzle_orm_1.ne)(schema_1.users.id, id)))
            .limit(1);
        if (phoneTaken[0]) {
            throw new Errors_1.ConflictError("Phone already exists");
        }
    }
    const updateData = {};
    if (name !== undefined)
        updateData.name = name;
    if (email !== undefined)
        updateData.email = email;
    if (subdomain !== undefined)
        updateData.subdomain = subdomain;
    if (phone !== undefined)
        updateData.phone = phone;
    if (password !== undefined) {
        updateData.password = await bcrypt_1.default.hash(password, 10);
    }
    if (Object.keys(updateData).length > 0) {
        await db_1.db.update(schema_1.users).set(updateData).where((0, drizzle_orm_1.eq)(schema_1.users.id, id));
    }
    return (0, response_1.SuccessResponse)(res, { message: "User updated successfully" }, 200);
}
// 6. Delete User
async function deleteUser(req, res) {
    const { id } = req.params;
    const existingUser = await db_1.db
        .select({ id: schema_1.users.id })
        .from(schema_1.users)
        .where((0, drizzle_orm_1.eq)(schema_1.users.id, id))
        .limit(1);
    if (!existingUser[0]) {
        throw new Errors_1.NotFound("User not found");
    }
    await db_1.db.delete(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, id));
    return (0, response_1.SuccessResponse)(res, { message: "User deleted successfully" }, 200);
}
