"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUserOrders = getAllUserOrders;
exports.getUserOrdersLists = getUserOrdersLists;
exports.getUserOrderById = getUserOrderById;
exports.createUserOrder = createUserOrder;
exports.changeUserOrderStatus = changeUserOrderStatus;
exports.deleteUserOrder = deleteUserOrder;
exports.bulkDeleteUserOrders = bulkDeleteUserOrders;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const Errors_1 = require("../../Errors");
const response_1 = require("../../utils/response");
const localization_1 = require("../../utils/localization");
const subscription_1 = require("../../utils/subscription");
const pagination_1 = require("../../utils/pagination");
// 1. Get All User Orders (Paginated with filters: user_id, package_id, status, from, to date range)
async function getAllUserOrders(req, res) {
    const lang = req.query.lang;
    const { page, limit, offset } = (0, pagination_1.getPaginationParams)(req);
    const { user_id, package_id, status, from, to } = req.query;
    const conditions = [];
    if (user_id && typeof user_id === "string") {
        conditions.push((0, drizzle_orm_1.eq)(schema_1.userOrders.user_id, user_id));
    }
    if (package_id && typeof package_id === "string") {
        conditions.push((0, drizzle_orm_1.eq)(schema_1.userOrders.package_id, package_id));
    }
    if (status && typeof status === "string") {
        conditions.push((0, drizzle_orm_1.eq)(schema_1.userOrders.status, status));
    }
    if (from && typeof from === "string") {
        conditions.push((0, drizzle_orm_1.gte)(schema_1.userOrders.createdAt, new Date(from)));
    }
    if (to && typeof to === "string") {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        conditions.push((0, drizzle_orm_1.lte)(schema_1.userOrders.createdAt, toDate));
    }
    const whereClause = conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined;
    const [countResult] = await db_1.db
        .select({ total: (0, drizzle_orm_1.sql) `count(*)` })
        .from(schema_1.userOrders)
        .where(whereClause);
    const total = Number(countResult?.total || 0);
    const list = await db_1.db
        .select({
        id: schema_1.userOrders.id,
        price: schema_1.userOrders.price,
        discount: schema_1.userOrders.discount,
        final_price: schema_1.userOrders.final_price,
        user_id: schema_1.userOrders.user_id,
        user_name: schema_1.users.name,
        user_phone: schema_1.users.phone,
        package_id: schema_1.userOrders.package_id,
        package_name: schema_1.packages.name,
        discount_id: schema_1.userOrders.discount_id,
        discount_name: schema_1.discounts.name,
        status: schema_1.userOrders.status,
        reject_reason: schema_1.userOrders.reject_reason,
        createdAt: schema_1.userOrders.createdAt,
        updatedAt: schema_1.userOrders.updatedAt,
    })
        .from(schema_1.userOrders)
        .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.userOrders.user_id, schema_1.users.id))
        .leftJoin(schema_1.packages, (0, drizzle_orm_1.eq)(schema_1.userOrders.package_id, schema_1.packages.id))
        .leftJoin(schema_1.discounts, (0, drizzle_orm_1.eq)(schema_1.userOrders.discount_id, schema_1.discounts.id))
        .where(whereClause)
        .limit(limit)
        .offset(offset);
    const formatted = list.map((item) => ({
        id: item.id,
        price: item.price,
        discount: item.discount,
        final_price: item.final_price,
        user_id: item.user_id,
        user_name: item.user_name,
        user_phone: item.user_phone,
        package_id: item.package_id,
        package_name: item.package_name ? (0, localization_1.getLocalizedText)(item.package_name, lang) : null,
        discount_id: item.discount_id,
        discount_name: item.discount_name ? (0, localization_1.getLocalizedText)(item.discount_name, lang) : null,
        status: item.status,
        reject_reason: item.reject_reason,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
    }));
    return (0, response_1.SuccessResponse)(res, {
        user_orders: formatted,
        pagination: (0, pagination_1.buildPaginationMeta)(total, page, limit),
    }, 200);
}
// 2. Relational Lists Endpoint: fetch users [id, name, phone] and packages [id, name localized]
async function getUserOrdersLists(req, res) {
    const lang = req.query.lang;
    const usersList = await db_1.db
        .select({
        id: schema_1.users.id,
        name: schema_1.users.name,
        phone: schema_1.users.phone,
    })
        .from(schema_1.users);
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
    const discountsList = await db_1.db
        .select({
        id: schema_1.discounts.id,
        name: schema_1.discounts.name,
        amount: schema_1.discounts.amount,
        type: schema_1.discounts.type,
    })
        .from(schema_1.discounts);
    const formattedDiscounts = discountsList.map((d) => ({
        id: d.id,
        name: (0, localization_1.getLocalizedText)(d.name, lang),
        amount: d.amount,
        type: d.type,
    }));
    return (0, response_1.SuccessResponse)(res, {
        users: usersList,
        packages: formattedPackages,
        discounts: formattedDiscounts,
    }, 200);
}
// 3. Get User Order By ID
async function getUserOrderById(req, res) {
    const { id } = req.params;
    const lang = req.query.lang;
    const row = await db_1.db
        .select({
        id: schema_1.userOrders.id,
        price: schema_1.userOrders.price,
        discount: schema_1.userOrders.discount,
        final_price: schema_1.userOrders.final_price,
        user_id: schema_1.userOrders.user_id,
        user_name: schema_1.users.name,
        user_phone: schema_1.users.phone,
        package_id: schema_1.userOrders.package_id,
        package_name: schema_1.packages.name,
        discount_id: schema_1.userOrders.discount_id,
        discount_name: schema_1.discounts.name,
        status: schema_1.userOrders.status,
        reject_reason: schema_1.userOrders.reject_reason,
        createdAt: schema_1.userOrders.createdAt,
        updatedAt: schema_1.userOrders.updatedAt,
    })
        .from(schema_1.userOrders)
        .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.userOrders.user_id, schema_1.users.id))
        .leftJoin(schema_1.packages, (0, drizzle_orm_1.eq)(schema_1.userOrders.package_id, schema_1.packages.id))
        .leftJoin(schema_1.discounts, (0, drizzle_orm_1.eq)(schema_1.userOrders.discount_id, schema_1.discounts.id))
        .where((0, drizzle_orm_1.eq)(schema_1.userOrders.id, id))
        .limit(1);
    if (!row[0])
        throw new Errors_1.NotFound("Order not found");
    const formatted = {
        ...row[0],
        package_name: row[0].package_name ? (0, localization_1.getLocalizedText)(row[0].package_name, lang) : null,
        discount_name: row[0].discount_name ? (0, localization_1.getLocalizedText)(row[0].discount_name, lang) : null,
    };
    return (0, response_1.SuccessResponse)(res, { user_order: formatted }, 200);
}
// 4. Create User Order
async function createUserOrder(req, res) {
    const { package_id, discount_id, price, discount, final_price, user_id } = req.body;
    // Verify user exists
    const user = await db_1.db.select({ id: schema_1.users.id }).from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, user_id)).limit(1);
    if (!user[0])
        throw new Errors_1.NotFound("User not found");
    // Verify package exists
    const pkg = await db_1.db.select({ id: schema_1.packages.id }).from(schema_1.packages).where((0, drizzle_orm_1.eq)(schema_1.packages.id, package_id)).limit(1);
    if (!pkg[0])
        throw new Errors_1.NotFound("Package not found");
    await db_1.db.insert(schema_1.userOrders).values({
        package_id,
        discount_id: discount_id ?? null,
        price: String(price),
        discount: String(discount ?? 0),
        final_price: String(final_price),
        user_id,
        status: "pending",
    });
    return (0, response_1.SuccessResponse)(res, { message: "User order created successfully" }, 201);
}
// 5. Change Order Status (Approve or Reject)
async function changeUserOrderStatus(req, res) {
    const { id } = req.params;
    const { status, reject_reason } = req.body;
    const orderRows = await db_1.db
        .select()
        .from(schema_1.userOrders)
        .where((0, drizzle_orm_1.eq)(schema_1.userOrders.id, id))
        .limit(1);
    if (!orderRows[0])
        throw new Errors_1.NotFound("Order not found");
    const order = orderRows[0];
    if (status === "reject") {
        if (!reject_reason || reject_reason.trim().length === 0) {
            throw new Errors_1.BadRequest("reject_reason is required when rejecting an order");
        }
        await db_1.db
            .update(schema_1.userOrders)
            .set({
            status: "reject",
            reject_reason,
        })
            .where((0, drizzle_orm_1.eq)(schema_1.userOrders.id, id));
        return (0, response_1.SuccessResponse)(res, { message: "Order rejected successfully", status: "reject", reject_reason }, 200);
    }
    if (status === "approve") {
        // Fetch package to calculate dates based on its type
        const pkgRows = await db_1.db
            .select()
            .from(schema_1.packages)
            .where((0, drizzle_orm_1.eq)(schema_1.packages.id, order.package_id))
            .limit(1);
        if (!pkgRows[0]) {
            throw new Errors_1.NotFound("Associated package not found");
        }
        const now = new Date();
        const startDateStr = now.toISOString().split("T")[0];
        const endDateStr = (0, subscription_1.calculateSubscriptionEndDate)(now, pkgRows[0].type);
        // 1. Update user: package_id, start_date = now(), end_date based on package type
        await db_1.db
            .update(schema_1.users)
            .set({
            package_id: order.package_id,
            start_date: startDateStr,
            end_date: endDateStr,
        })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, order.user_id));
        // 2. Update order status: approve
        await db_1.db
            .update(schema_1.userOrders)
            .set({
            status: "approve",
            reject_reason: null,
        })
            .where((0, drizzle_orm_1.eq)(schema_1.userOrders.id, id));
        return (0, response_1.SuccessResponse)(res, {
            message: "Order approved successfully and user subscription activated",
            status: "approve",
            subscription: {
                package_id: order.package_id,
                package_type: pkgRows[0].type,
                start_date: startDateStr,
                end_date: endDateStr,
            },
        }, 200);
    }
    throw new Errors_1.BadRequest("Invalid status");
}
// 6. Delete User Order
async function deleteUserOrder(req, res) {
    const { id } = req.params;
    const existing = await db_1.db.select().from(schema_1.userOrders).where((0, drizzle_orm_1.eq)(schema_1.userOrders.id, id)).limit(1);
    if (!existing[0])
        throw new Errors_1.NotFound("Order not found");
    await db_1.db.delete(schema_1.userOrders).where((0, drizzle_orm_1.eq)(schema_1.userOrders.id, id));
    return (0, response_1.SuccessResponse)(res, { message: "Order deleted successfully" }, 200);
}
// 7. Bulk Delete User Orders
async function bulkDeleteUserOrders(req, res) {
    const { ids } = req.body;
    const existing = await db_1.db.select().from(schema_1.userOrders).where((0, drizzle_orm_1.inArray)(schema_1.userOrders.id, ids));
    if (existing.length === 0) {
        return (0, response_1.SuccessResponse)(res, { message: "No matching orders found", deletedCount: 0 }, 200);
    }
    await db_1.db.delete(schema_1.userOrders).where((0, drizzle_orm_1.inArray)(schema_1.userOrders.id, ids));
    return (0, response_1.SuccessResponse)(res, {
        message: `${existing.length} order(s) deleted successfully`,
        deletedCount: existing.length,
    }, 200);
}
