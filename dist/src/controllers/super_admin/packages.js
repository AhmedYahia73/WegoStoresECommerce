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
    const list = await db_1.db.select().from(schema_1.packages).limit(limit).offset(offset);
    const formatted = list.map((item) => ({
        id: item.id,
        name: (0, localization_1.getLocalizedText)(item.name, lang),
        names: item.name,
        type: item.type,
        price: item.price,
        status: item.status,
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
        type: schema_1.packages.type,
        price: schema_1.packages.price,
    })
        .from(schema_1.packages)
        .where((0, drizzle_orm_1.eq)(schema_1.packages.status, true));
    const formatted = list.map((item) => ({
        id: item.id,
        name: (0, localization_1.getLocalizedText)(item.name, lang),
        type: item.type,
        price: item.price,
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
        names: row[0].name,
        type: row[0].type,
        price: row[0].price,
        status: row[0].status,
        createdAt: row[0].createdAt,
        updatedAt: row[0].updatedAt,
    };
    return (0, response_1.SuccessResponse)(res, { package: formatted }, 200);
}
// 4. Create Package
async function createPackage(req, res) {
    const { name, type, price, status } = req.body;
    await db_1.db.insert(schema_1.packages).values({
        name,
        type,
        price: String(price),
        status: status ?? true,
    });
    return (0, response_1.SuccessResponse)(res, { message: "Package created successfully" }, 201);
}
// 5. Update Package
async function updatePackage(req, res) {
    const { id } = req.params;
    const { name, type, price, status } = req.body;
    const existing = await db_1.db.select().from(schema_1.packages).where((0, drizzle_orm_1.eq)(schema_1.packages.id, id)).limit(1);
    if (!existing[0])
        throw new Errors_1.NotFound("Package not found");
    const updateData = {};
    if (name !== undefined)
        updateData.name = name;
    if (type !== undefined)
        updateData.type = type;
    if (price !== undefined)
        updateData.price = String(price);
    if (status !== undefined)
        updateData.status = status;
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
