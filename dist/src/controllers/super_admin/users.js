"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUsers = getAllUsers;
exports.getUsersLists = getUsersLists;
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
const pagination_1 = require("../../utils/pagination");
const localization_1 = require("../../utils/localization");
const subscription_1 = require("../../utils/subscription");
const tenantSchemaService_1 = require("../../services/tenantSchemaService");
// 1. Get All Users (Paginated, includes package info, subscription dates & orders count)
async function getAllUsers(req, res) {
    const lang = req.query.lang;
    const { page, limit, offset } = (0, pagination_1.getPaginationParams)(req);
    const [countResult] = await db_1.db.select({ total: (0, drizzle_orm_1.sql) `count(*)` }).from(schema_1.users);
    const total = Number(countResult?.total || 0);
    const allUsers = await db_1.db
        .select({
        id: schema_1.users.id,
        name: schema_1.users.name,
        email: schema_1.users.email,
        subdomain: schema_1.users.subdomain,
        phone: schema_1.users.phone,
        package_id: schema_1.users.package_id,
        package_name: schema_1.packages.name,
        start_date: schema_1.users.start_date,
        end_date: schema_1.users.end_date,
        createdAt: schema_1.users.createdAt,
        updatedAt: schema_1.users.updatedAt,
    })
        .from(schema_1.users)
        .leftJoin(schema_1.packages, (0, drizzle_orm_1.eq)(schema_1.users.package_id, schema_1.packages.id))
        .limit(limit)
        .offset(offset);
    // Fetch count of orders for each user from table `orders`
    const userIds = allUsers.map((u) => u.id);
    const orderCounts = userIds.length > 0
        ? await db_1.db
            .select({
            user_id: schema_1.orders.user_id,
            count: (0, drizzle_orm_1.sql) `count(*)`,
        })
            .from(schema_1.orders)
            .where((0, drizzle_orm_1.inArray)(schema_1.orders.user_id, userIds))
            .groupBy(schema_1.orders.user_id)
        : [];
    const countsMap = new Map();
    for (const row of orderCounts) {
        countsMap.set(row.user_id, Number(row.count || 0));
    }
    const formattedUsers = allUsers.map((user) => ({
        ...user,
        package_name: user.package_name ? (0, localization_1.getLocalizedText)(user.package_name, lang) : null,
        package_names: user.package_name ?? null,
        orders_count: countsMap.get(user.id) || 0,
    }));
    return (0, response_1.SuccessResponse)(res, {
        users: formattedUsers,
        pagination: (0, pagination_1.buildPaginationMeta)(total, page, limit),
    }, 200);
}
// 2. Get Users Relational Lists (e.g. packages for user add/edit)
async function getUsersLists(req, res) {
    const lang = req.query.lang;
    const packagesList = await db_1.db
        .select({
        id: schema_1.packages.id,
        name: schema_1.packages.name,
        type: schema_1.packages.type,
        price: schema_1.packages.price,
    })
        .from(schema_1.packages)
        .where((0, drizzle_orm_1.eq)(schema_1.packages.status, true));
    const formattedPackages = packagesList.map((pkg) => ({
        id: pkg.id,
        name: (0, localization_1.getLocalizedText)(pkg.name, lang),
        type: pkg.type,
        price: pkg.price,
    }));
    return (0, response_1.SuccessResponse)(res, { packages: formattedPackages }, 200);
}
// 3. Get Users Selection (id, name, phone)
async function getUsersSelection(req, res) {
    const list = await db_1.db
        .select({
        id: schema_1.users.id,
        name: schema_1.users.name,
        phone: schema_1.users.phone,
    })
        .from(schema_1.users);
    return (0, response_1.SuccessResponse)(res, { users: list }, 200);
}
// 4. Get User By ID
async function getUserById(req, res) {
    const { id } = req.params;
    const lang = req.query.lang;
    const userRow = await db_1.db
        .select({
        id: schema_1.users.id,
        name: schema_1.users.name,
        email: schema_1.users.email,
        subdomain: schema_1.users.subdomain,
        phone: schema_1.users.phone,
        package_id: schema_1.users.package_id,
        package_name: schema_1.packages.name,
        start_date: schema_1.users.start_date,
        end_date: schema_1.users.end_date,
        createdAt: schema_1.users.createdAt,
        updatedAt: schema_1.users.updatedAt,
    })
        .from(schema_1.users)
        .leftJoin(schema_1.packages, (0, drizzle_orm_1.eq)(schema_1.users.package_id, schema_1.packages.id))
        .where((0, drizzle_orm_1.eq)(schema_1.users.id, id))
        .limit(1);
    if (!userRow[0]) {
        throw new Errors_1.NotFound("User not found");
    }
    // Count orders for this user
    const [orderCountRow] = await db_1.db
        .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
        .from(schema_1.orders)
        .where((0, drizzle_orm_1.eq)(schema_1.orders.user_id, id));
    const formatted = {
        ...userRow[0],
        package_name: userRow[0].package_name ? (0, localization_1.getLocalizedText)(userRow[0].package_name, lang) : null,
        package_names: userRow[0].package_name ?? null,
        orders_count: Number(orderCountRow?.count || 0),
    };
    return (0, response_1.SuccessResponse)(res, { user: formatted }, 200);
}
// 5. Create User
async function createUser(req, res) {
    const { name, email, subdomain, phone, password, package_id } = req.body;
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
    // Handle subscription if package_id is provided
    let calculatedStartDate = null;
    let calculatedEndDate = null;
    if (package_id) {
        const pkg = await db_1.db.select().from(schema_1.packages).where((0, drizzle_orm_1.eq)(schema_1.packages.id, package_id)).limit(1);
        if (!pkg[0]) {
            throw new Errors_1.NotFound("Selected package not found");
        }
        const now = new Date();
        calculatedStartDate = now.toISOString().split("T")[0];
        calculatedEndDate = (0, subscription_1.calculateSubscriptionEndDate)(now, pkg[0].type);
    }
    const hashedPassword = await bcrypt_1.default.hash(password, 10);
    // 1. Insert user into central users table
    await db_1.db.insert(schema_1.users).values({
        name,
        email,
        subdomain,
        phone,
        password: hashedPassword,
        package_id: package_id ?? null,
        start_date: calculatedStartDate,
        end_date: calculatedEndDate,
    });
    // 2. Automatically create tenant wildcard MySQL schema with all 22 tables & initial data
    try {
        await (0, tenantSchemaService_1.createTenantSchema)(subdomain);
    }
    catch (schemaError) {
        await db_1.db.delete(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.subdomain, subdomain));
        throw schemaError;
    }
    return (0, response_1.SuccessResponse)(res, { message: "User and tenant schema created successfully" }, 201);
}
// 6. Update User
async function updateUser(req, res) {
    const { id } = req.params;
    const { name, email, subdomain, phone, password, package_id } = req.body;
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
    const oldSubdomain = existingUser[0].subdomain;
    const isSubdomainChanged = subdomain && subdomain !== oldSubdomain;
    if (isSubdomainChanged) {
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
    // Handle package change
    if (package_id !== undefined) {
        if (package_id === null || package_id === "") {
            updateData.package_id = null;
            updateData.start_date = null;
            updateData.end_date = null;
        }
        else {
            const pkg = await db_1.db.select().from(schema_1.packages).where((0, drizzle_orm_1.eq)(schema_1.packages.id, package_id)).limit(1);
            if (!pkg[0]) {
                throw new Errors_1.NotFound("Selected package not found");
            }
            const now = new Date();
            updateData.package_id = pkg[0].id;
            updateData.start_date = now.toISOString().split("T")[0];
            updateData.end_date = (0, subscription_1.calculateSubscriptionEndDate)(now, pkg[0].type);
        }
    }
    // If subdomain changed, rename the MySQL database / schema
    if (isSubdomainChanged) {
        await (0, tenantSchemaService_1.renameTenantSchema)(oldSubdomain, subdomain);
    }
    if (Object.keys(updateData).length > 0) {
        await db_1.db.update(schema_1.users).set(updateData).where((0, drizzle_orm_1.eq)(schema_1.users.id, id));
    }
    return (0, response_1.SuccessResponse)(res, { message: "User updated successfully" }, 200);
}
// 7. Delete User
async function deleteUser(req, res) {
    const { id } = req.params;
    const existingUser = await db_1.db
        .select({ id: schema_1.users.id, subdomain: schema_1.users.subdomain })
        .from(schema_1.users)
        .where((0, drizzle_orm_1.eq)(schema_1.users.id, id))
        .limit(1);
    if (!existingUser[0]) {
        throw new Errors_1.NotFound("User not found");
    }
    // 1. Drop tenant wildcard database/schema
    await (0, tenantSchemaService_1.deleteTenantSchema)(existingUser[0].subdomain);
    // 2. Delete user from central database
    await db_1.db.delete(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, id));
    return (0, response_1.SuccessResponse)(res, { message: "User and tenant schema deleted successfully" }, 200);
}
