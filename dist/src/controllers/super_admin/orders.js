"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllOrders = getAllOrders;
exports.getOrdersLists = getOrdersLists;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const Errors_1 = require("../../Errors");
const response_1 = require("../../utils/response");
const pagination_1 = require("../../utils/pagination");
function normalizeOptionalQueryParam(value) {
    if (typeof value !== "string")
        return null;
    const trimmed = value.trim();
    if (!trimmed || trimmed.toLowerCase() === "null")
        return null;
    return trimmed;
}
// 1. Get Aggregated Orders by User with Optional Filters (user_id, from, to)
async function getAllOrders(req, res) {
    const { page, limit, offset } = (0, pagination_1.getPaginationParams)(req);
    const userId = normalizeOptionalQueryParam(req.query.user_id);
    const fromParam = normalizeOptionalQueryParam(req.query.from);
    const toParam = normalizeOptionalQueryParam(req.query.to);
    const conditions = [];
    if (userId) {
        conditions.push((0, drizzle_orm_1.eq)(schema_1.orders.user_id, userId));
    }
    if (fromParam) {
        const fromDate = new Date(fromParam);
        if (Number.isNaN(fromDate.getTime())) {
            throw new Errors_1.BadRequest("Invalid 'from' date");
        }
        conditions.push((0, drizzle_orm_1.gte)(schema_1.orders.createdAt, fromDate));
    }
    if (toParam) {
        const toDate = new Date(toParam);
        if (Number.isNaN(toDate.getTime())) {
            throw new Errors_1.BadRequest("Invalid 'to' date");
        }
        if (/^\d{4}-\d{2}-\d{2}$/.test(toParam)) {
            toDate.setHours(23, 59, 59, 999);
        }
        conditions.push((0, drizzle_orm_1.lte)(schema_1.orders.createdAt, toDate));
    }
    const whereClause = conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined;
    const [countResult] = await db_1.db
        .select({ total: (0, drizzle_orm_1.sql) `COUNT(DISTINCT ${schema_1.orders.user_id})` })
        .from(schema_1.orders)
        .where(whereClause);
    const total = Number(countResult?.total || 0);
    const list = await db_1.db
        .select({
        user_id: schema_1.orders.user_id,
        total_orders: (0, drizzle_orm_1.sql) `COALESCE(SUM(${schema_1.orders.total}), 0)`,
        name: schema_1.users.name,
        email: schema_1.users.email,
        phone: schema_1.users.phone,
    })
        .from(schema_1.orders)
        .innerJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.orders.user_id, schema_1.users.id))
        .where(whereClause)
        .groupBy(schema_1.orders.user_id, schema_1.users.name, schema_1.users.email, schema_1.users.phone)
        .limit(limit)
        .offset(offset);
    const formatted = list.map((row) => ({
        user_id: row.user_id,
        total_orders: Number(Number(row.total_orders || 0).toFixed(2)),
        name: row.name,
        email: row.email,
        phone: row.phone,
    }));
    return (0, response_1.SuccessResponse)(res, {
        orders: formatted,
        pagination: (0, pagination_1.buildPaginationMeta)(total, page, limit),
    }, 200);
}
// 2. Relational Lists Endpoint: fetch users [id, name, phone]
async function getOrdersLists(req, res) {
    const usersList = await db_1.db
        .select({
        id: schema_1.users.id,
        name: schema_1.users.name,
        phone: schema_1.users.phone,
    })
        .from(schema_1.users);
    return (0, response_1.SuccessResponse)(res, { users: usersList }, 200);
}
