"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUserOrders = getAllUserOrders;
exports.getUserOrdersLists = getUserOrdersLists;
exports.getUserOrderById = getUserOrderById;
exports.createUserOrder = createUserOrder;
exports.approveUserOrderRecord = approveUserOrderRecord;
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
const handleImages_1 = require("../../utils/handleImages");
// 1. Get All User Orders (Paginated with filters: user_id, package_id, status, from, to date range)
async function getAllUserOrders(req, res) {
    const lang = req.query.lang;
    const { page, limit, offset } = (0, pagination_1.getPaginationParams)(req);
    const { user_id, package_id, status, from, to } = req.query;
    const conditions = [(0, drizzle_orm_1.ne)(schema_1.userOrders.status, "faild")];
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
        user_id: schema_1.userOrders.user_id,
        user_name: schema_1.users.name,
        user_phone: schema_1.users.phone,
        package_id: schema_1.userOrders.package_id,
        package_name: schema_1.packages.name,
        status: schema_1.userOrders.status,
        reject_reason: schema_1.userOrders.reject_reason,
        receipt: schema_1.userOrders.receipt,
        createdAt: schema_1.userOrders.createdAt,
        updatedAt: schema_1.userOrders.updatedAt,
    })
        .from(schema_1.userOrders)
        .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.userOrders.user_id, schema_1.users.id))
        .leftJoin(schema_1.packages, (0, drizzle_orm_1.eq)(schema_1.userOrders.package_id, schema_1.packages.id))
        .where(whereClause)
        .limit(limit)
        .offset(offset);
    const formatted = list.map((item) => ({
        id: item.id,
        price: item.price,
        user_id: item.user_id,
        user_name: item.user_name,
        user_phone: item.user_phone,
        package_id: item.package_id,
        package_name: item.package_name ? (0, localization_1.getLocalizedText)(item.package_name, lang) : null,
        status: item.status,
        reject_reason: item.reject_reason,
        receipt: item.receipt,
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
        price: schema_1.packages.price,
        orders_from: schema_1.packages.orders_from,
        orders_to: schema_1.packages.orders_to,
        sort: schema_1.packages.sort,
    })
        .from(schema_1.packages)
        .orderBy((0, drizzle_orm_1.asc)(schema_1.packages.sort));
    const formattedPackages = packagesList.map((pkg) => ({
        id: pkg.id,
        name: (0, localization_1.getLocalizedText)(pkg.name, lang),
        price: pkg.price,
        orders_from: pkg.orders_from,
        orders_to: pkg.orders_to,
        sort: pkg.sort,
    }));
    return (0, response_1.SuccessResponse)(res, {
        users: usersList,
        packages: formattedPackages,
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
        user_id: schema_1.userOrders.user_id,
        user_name: schema_1.users.name,
        user_phone: schema_1.users.phone,
        package_id: schema_1.userOrders.package_id,
        package_name: schema_1.packages.name,
        status: schema_1.userOrders.status,
        reject_reason: schema_1.userOrders.reject_reason,
        receipt: schema_1.userOrders.receipt,
        createdAt: schema_1.userOrders.createdAt,
        updatedAt: schema_1.userOrders.updatedAt,
    })
        .from(schema_1.userOrders)
        .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.userOrders.user_id, schema_1.users.id))
        .leftJoin(schema_1.packages, (0, drizzle_orm_1.eq)(schema_1.userOrders.package_id, schema_1.packages.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.userOrders.id, id), (0, drizzle_orm_1.ne)(schema_1.userOrders.status, "faild")))
        .limit(1);
    if (!row[0])
        throw new Errors_1.NotFound("Order not found");
    const formatted = {
        ...row[0],
        package_name: row[0].package_name ? (0, localization_1.getLocalizedText)(row[0].package_name, lang) : null,
    };
    return (0, response_1.SuccessResponse)(res, { user_order: formatted }, 200);
}
// 4. Create User Order
async function createUserOrder(req, res) {
    const { package_id, price, user_id, receipt } = req.body;
    // Verify user exists
    const user = await db_1.db.select({ id: schema_1.users.id }).from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, user_id)).limit(1);
    if (!user[0])
        throw new Errors_1.NotFound("User not found");
    // Verify package exists
    const pkg = await db_1.db.select({ id: schema_1.packages.id }).from(schema_1.packages).where((0, drizzle_orm_1.eq)(schema_1.packages.id, package_id)).limit(1);
    if (!pkg[0])
        throw new Errors_1.NotFound("Package not found");
    const receiptUrl = receipt ? await (0, handleImages_1.uploadImage)(req, receipt, "user_orders") : null;
    await db_1.db.insert(schema_1.userOrders).values({
        package_id,
        price: String(price),
        user_id,
        status: "pending",
        receipt: receiptUrl || null,
    });
    return (0, response_1.SuccessResponse)(res, { message: "User order created successfully" }, 201);
}
// Shared helper to approve a user order and activate the user's package subscription
async function approveUserOrderRecord(order, options) {
    const pkgRows = await db_1.db
        .select()
        .from(schema_1.packages)
        .where((0, drizzle_orm_1.eq)(schema_1.packages.id, order.package_id))
        .limit(1);
    if (!pkgRows[0]) {
        throw new Errors_1.NotFound("Associated package not found");
    }
    if (options?.idempotent && order.status === "approve") {
        return {
            alreadyApproved: true,
            subscription: {
                package_id: order.package_id,
                orders_from: pkgRows[0].orders_from,
                orders_to: pkgRows[0].orders_to,
            },
        };
    }
    const now = new Date();
    const startDateStr = now.toISOString().split("T")[0];
    const endDateStr = (0, subscription_1.calculateSubscriptionEndDate)(now);
    await db_1.db.transaction(async (tx) => {
        // 1. Update user: package_id, orders_from/to from package, start_date = now(), end_date = +1 month
        await tx
            .update(schema_1.users)
            .set({
            package_id: order.package_id,
            orders_from: pkgRows[0].orders_from,
            orders_to: pkgRows[0].orders_to,
            upgrade_notified: false,
            start_date: startDateStr,
            end_date: endDateStr,
        })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, order.user_id));
        // 2. Update order status: approve
        await tx
            .update(schema_1.userOrders)
            .set({
            status: "approve",
            reject_reason: null,
        })
            .where((0, drizzle_orm_1.eq)(schema_1.userOrders.id, order.id));
    });
    return {
        alreadyApproved: false,
        subscription: {
            package_id: order.package_id,
            orders_from: pkgRows[0].orders_from,
            orders_to: pkgRows[0].orders_to,
            start_date: startDateStr,
            end_date: endDateStr,
        },
    };
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
        const { subscription } = await approveUserOrderRecord(order);
        return (0, response_1.SuccessResponse)(res, {
            message: "Order approved successfully and user subscription activated",
            status: "approve",
            subscription,
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
    if (existing[0].receipt) {
        await (0, handleImages_1.deleteImage)(existing[0].receipt);
    }
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
    for (const order of existing) {
        if (order.receipt) {
            await (0, handleImages_1.deleteImage)(order.receipt);
        }
    }
    await db_1.db.delete(schema_1.userOrders).where((0, drizzle_orm_1.inArray)(schema_1.userOrders.id, ids));
    return (0, response_1.SuccessResponse)(res, {
        message: `${existing.length} order(s) deleted successfully`,
        deletedCount: existing.length,
    }, 200);
}
