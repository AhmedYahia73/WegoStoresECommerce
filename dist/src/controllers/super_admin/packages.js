"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllPackages = getAllPackages;
exports.getPackagesSelection = getPackagesSelection;
exports.getPackageById = getPackageById;
exports.createPackage = createPackage;
exports.updatePackage = updatePackage;
exports.deletePackage = deletePackage;
exports.bulkDeletePackages = bulkDeletePackages;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const Errors_1 = require("../../Errors");
const response_1 = require("../../utils/response");
const localization_1 = require("../../utils/localization");
const pagination_1 = require("../../utils/pagination");
// 1. Get All Packages (Paginated, localized name)
async function getAllPackages(req, res) {
    const lang = req.query.lang;
    const { page, limit, offset } = (0, pagination_1.getPaginationParams)(req);
    const [countResult] = await db_1.db.select({ total: (0, drizzle_orm_1.sql) `count(*)` }).from(schema_1.packages);
    const total = Number(countResult?.total || 0);
    const list = await db_1.db
        .select()
        .from(schema_1.packages)
        .orderBy((0, drizzle_orm_1.asc)(schema_1.packages.sort))
        .limit(limit)
        .offset(offset);
    const formatted = list.map((item) => ({
        id: item.id,
        name: (0, localization_1.getLocalizedText)(item.name, lang),
        names: (0, localization_1.parseJsonIfNeeded)(item.name),
        price: item.price,
        orders_from: item.orders_from,
        orders_to: item.orders_to,
        sort: item.sort,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
    }));
    return (0, response_1.SuccessResponse)(res, {
        packages: formatted,
        pagination: (0, pagination_1.buildPaginationMeta)(total, page, limit),
    }, 200);
}
// 2. Get Packages Selection for Dropdowns (id, name localized)
async function getPackagesSelection(req, res) {
    const lang = req.query.lang;
    const list = await db_1.db
        .select({
        id: schema_1.packages.id,
        name: schema_1.packages.name,
        price: schema_1.packages.price,
        orders_from: schema_1.packages.orders_from,
        orders_to: schema_1.packages.orders_to,
        sort: schema_1.packages.sort,
    })
        .from(schema_1.packages)
        .orderBy((0, drizzle_orm_1.asc)(schema_1.packages.sort));
    const formatted = list.map((item) => ({
        id: item.id,
        name: (0, localization_1.getLocalizedText)(item.name, lang),
        price: item.price,
        orders_from: item.orders_from,
        orders_to: item.orders_to,
        sort: item.sort,
    }));
    return (0, response_1.SuccessResponse)(res, { packages: formatted }, 200);
}
// 3. Get Package By ID
async function getPackageById(req, res) {
    const { id } = req.params;
    const lang = req.query.lang;
    const row = await db_1.db.select().from(schema_1.packages).where((0, drizzle_orm_1.eq)(schema_1.packages.id, id)).limit(1);
    if (!row[0])
        throw new Errors_1.NotFound("Package not found");
    const formatted = {
        id: row[0].id,
        name: (0, localization_1.getLocalizedText)(row[0].name, lang),
        names: (0, localization_1.parseJsonIfNeeded)(row[0].name),
        price: row[0].price,
        orders_from: row[0].orders_from,
        orders_to: row[0].orders_to,
        sort: row[0].sort,
        createdAt: row[0].createdAt,
        updatedAt: row[0].updatedAt,
    };
    return (0, response_1.SuccessResponse)(res, { package: formatted }, 200);
}
// 4. Create Package
async function createPackage(req, res) {
    const { name, price, orders_from, orders_to, sort } = req.body;
    await db_1.db.insert(schema_1.packages).values({
        name: (0, localization_1.parseJsonIfNeeded)(name),
        price: String(price),
        orders_from,
        orders_to: orders_to ?? null,
        sort,
    });
    return (0, response_1.SuccessResponse)(res, { message: "Package created successfully" }, 201);
}
// 5. Update Package
async function updatePackage(req, res) {
    const { id } = req.params;
    const { name, price, orders_from, orders_to, sort } = req.body;
    const existing = await db_1.db.select().from(schema_1.packages).where((0, drizzle_orm_1.eq)(schema_1.packages.id, id)).limit(1);
    if (!existing[0])
        throw new Errors_1.NotFound("Package not found");
    const nextOrdersFrom = orders_from !== undefined ? orders_from : existing[0].orders_from;
    const nextOrdersTo = orders_to !== undefined ? orders_to : existing[0].orders_to;
    if (nextOrdersTo !== null && nextOrdersTo < nextOrdersFrom) {
        throw new Errors_1.BadRequest("orders_to must be greater than or equal to orders_from");
    }
    const updateData = {};
    if (name !== undefined)
        updateData.name = (0, localization_1.parseJsonIfNeeded)(name);
    if (price !== undefined)
        updateData.price = String(price);
    if (orders_from !== undefined)
        updateData.orders_from = orders_from;
    if (orders_to !== undefined)
        updateData.orders_to = orders_to;
    if (sort !== undefined)
        updateData.sort = sort;
    if (Object.keys(updateData).length > 0) {
        await db_1.db.update(schema_1.packages).set(updateData).where((0, drizzle_orm_1.eq)(schema_1.packages.id, id));
    }
    return (0, response_1.SuccessResponse)(res, { message: "Package updated successfully" }, 200);
}
// 6. Delete Package
async function deletePackage(req, res) {
    const { id } = req.params;
    const existing = await db_1.db.select().from(schema_1.packages).where((0, drizzle_orm_1.eq)(schema_1.packages.id, id)).limit(1);
    if (!existing[0])
        throw new Errors_1.NotFound("Package not found");
    await db_1.db.delete(schema_1.packages).where((0, drizzle_orm_1.eq)(schema_1.packages.id, id));
    return (0, response_1.SuccessResponse)(res, { message: "Package deleted successfully" }, 200);
}
// 7. Bulk Delete Packages
async function bulkDeletePackages(req, res) {
    const { ids } = req.body;
    const existing = await db_1.db.select().from(schema_1.packages).where((0, drizzle_orm_1.inArray)(schema_1.packages.id, ids));
    if (existing.length === 0) {
        return (0, response_1.SuccessResponse)(res, { message: "No matching packages found", deletedCount: 0 }, 200);
    }
    await db_1.db.delete(schema_1.packages).where((0, drizzle_orm_1.inArray)(schema_1.packages.id, ids));
    return (0, response_1.SuccessResponse)(res, {
        message: `${existing.length} package(s) deleted successfully`,
        deletedCount: existing.length,
    }, 200);
}
