"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllDiscounts = getAllDiscounts;
exports.getDiscountsSelection = getDiscountsSelection;
exports.getDiscountById = getDiscountById;
exports.createDiscount = createDiscount;
exports.updateDiscount = updateDiscount;
exports.deleteDiscount = deleteDiscount;
exports.bulkDeleteDiscounts = bulkDeleteDiscounts;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const Errors_1 = require("../../Errors");
const response_1 = require("../../utils/response");
const localization_1 = require("../../utils/localization");
const pagination_1 = require("../../utils/pagination");
// 1. Get All Discounts (Paginated, localized name)
async function getAllDiscounts(req, res) {
    const lang = req.query.lang;
    const { page, limit, offset } = (0, pagination_1.getPaginationParams)(req);
    const [countResult] = await db_1.db.select({ total: (0, drizzle_orm_1.sql) `count(*)` }).from(schema_1.discounts);
    const total = Number(countResult?.total || 0);
    const list = await db_1.db.select().from(schema_1.discounts).limit(limit).offset(offset);
    const formatted = list.map((item) => ({
        id: item.id,
        name: (0, localization_1.getLocalizedText)(item.name, lang),
        names: item.name,
        amount: item.amount,
        type: item.type,
        start_date: item.start_date,
        end_date: item.end_date,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
    }));
    return (0, response_1.SuccessResponse)(res, {
        discounts: formatted,
        pagination: (0, pagination_1.buildPaginationMeta)(total, page, limit),
    }, 200);
}
// 2. Get Discounts Selection for Dropdowns (id, name localized)
async function getDiscountsSelection(req, res) {
    const lang = req.query.lang;
    const list = await db_1.db
        .select({
        id: schema_1.discounts.id,
        name: schema_1.discounts.name,
        amount: schema_1.discounts.amount,
        type: schema_1.discounts.type,
    })
        .from(schema_1.discounts);
    const formatted = list.map((item) => ({
        id: item.id,
        name: (0, localization_1.getLocalizedText)(item.name, lang),
        amount: item.amount,
        type: item.type,
    }));
    return (0, response_1.SuccessResponse)(res, { discounts: formatted }, 200);
}
// 3. Get Discount By ID
async function getDiscountById(req, res) {
    const { id } = req.params;
    const lang = req.query.lang;
    const row = await db_1.db.select().from(schema_1.discounts).where((0, drizzle_orm_1.eq)(schema_1.discounts.id, id)).limit(1);
    if (!row[0])
        throw new Errors_1.NotFound("Discount not found");
    const formatted = {
        id: row[0].id,
        name: (0, localization_1.getLocalizedText)(row[0].name, lang),
        names: row[0].name,
        amount: row[0].amount,
        type: row[0].type,
        start_date: row[0].start_date,
        end_date: row[0].end_date,
        createdAt: row[0].createdAt,
        updatedAt: row[0].updatedAt,
    };
    return (0, response_1.SuccessResponse)(res, { discount: formatted }, 200);
}
// 4. Create Discount
async function createDiscount(req, res) {
    const { name, amount, type, start_date, end_date } = req.body;
    await db_1.db.insert(schema_1.discounts).values({
        name,
        amount: String(amount),
        type,
        start_date,
        end_date,
    });
    return (0, response_1.SuccessResponse)(res, { message: "Discount created successfully" }, 201);
}
// 5. Update Discount
async function updateDiscount(req, res) {
    const { id } = req.params;
    const { name, amount, type, start_date, end_date } = req.body;
    const existing = await db_1.db.select().from(schema_1.discounts).where((0, drizzle_orm_1.eq)(schema_1.discounts.id, id)).limit(1);
    if (!existing[0])
        throw new Errors_1.NotFound("Discount not found");
    const updateData = {};
    if (name !== undefined)
        updateData.name = name;
    if (amount !== undefined)
        updateData.amount = String(amount);
    if (type !== undefined)
        updateData.type = type;
    if (start_date !== undefined)
        updateData.start_date = start_date;
    if (end_date !== undefined)
        updateData.end_date = end_date;
    if (Object.keys(updateData).length > 0) {
        await db_1.db.update(schema_1.discounts).set(updateData).where((0, drizzle_orm_1.eq)(schema_1.discounts.id, id));
    }
    return (0, response_1.SuccessResponse)(res, { message: "Discount updated successfully" }, 200);
}
// 6. Delete Discount
async function deleteDiscount(req, res) {
    const { id } = req.params;
    const existing = await db_1.db.select().from(schema_1.discounts).where((0, drizzle_orm_1.eq)(schema_1.discounts.id, id)).limit(1);
    if (!existing[0])
        throw new Errors_1.NotFound("Discount not found");
    await db_1.db.delete(schema_1.discounts).where((0, drizzle_orm_1.eq)(schema_1.discounts.id, id));
    return (0, response_1.SuccessResponse)(res, { message: "Discount deleted successfully" }, 200);
}
// 7. Bulk Delete Discounts
async function bulkDeleteDiscounts(req, res) {
    const { ids } = req.body;
    const existing = await db_1.db.select().from(schema_1.discounts).where((0, drizzle_orm_1.inArray)(schema_1.discounts.id, ids));
    if (existing.length === 0) {
        return (0, response_1.SuccessResponse)(res, { message: "No matching discounts found", deletedCount: 0 }, 200);
    }
    await db_1.db.delete(schema_1.discounts).where((0, drizzle_orm_1.inArray)(schema_1.discounts.id, ids));
    return (0, response_1.SuccessResponse)(res, {
        message: `${existing.length} discount(s) deleted successfully`,
        deletedCount: existing.length,
    }, 200);
}
