"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllWalletOrders = getAllWalletOrders;
exports.getWalletOrdersLists = getWalletOrdersLists;
exports.getWalletOrderById = getWalletOrderById;
exports.createWalletOrder = createWalletOrder;
exports.approveWalletOrderRecord = approveWalletOrderRecord;
exports.changeWalletOrderStatus = changeWalletOrderStatus;
exports.deleteWalletOrder = deleteWalletOrder;
exports.bulkDeleteWalletOrders = bulkDeleteWalletOrders;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const Errors_1 = require("../../Errors");
const response_1 = require("../../utils/response");
const pagination_1 = require("../../utils/pagination");
const handleImages_1 = require("../../utils/handleImages");
// 1. Get All Wallet Orders (Paginated with filters: user_id, status, from, to date range)
async function getAllWalletOrders(req, res) {
    const { page, limit, offset } = (0, pagination_1.getPaginationParams)(req);
    const { user_id, status, from, to } = req.query;
    const conditions = [(0, drizzle_orm_1.ne)(schema_1.walletOrders.status, "faild")];
    if (user_id && typeof user_id === "string") {
        conditions.push((0, drizzle_orm_1.eq)(schema_1.walletOrders.user_id, user_id));
    }
    if (status && typeof status === "string") {
        conditions.push((0, drizzle_orm_1.eq)(schema_1.walletOrders.status, status));
    }
    if (from && typeof from === "string") {
        conditions.push((0, drizzle_orm_1.gte)(schema_1.walletOrders.createdAt, new Date(from)));
    }
    if (to && typeof to === "string") {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        conditions.push((0, drizzle_orm_1.lte)(schema_1.walletOrders.createdAt, toDate));
    }
    const whereClause = conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined;
    const [countResult] = await db_1.db
        .select({ total: (0, drizzle_orm_1.sql) `count(*)` })
        .from(schema_1.walletOrders)
        .where(whereClause);
    const total = Number(countResult?.total || 0);
    const list = await db_1.db
        .select({
        id: schema_1.walletOrders.id,
        wallet: schema_1.walletOrders.wallet,
        user_id: schema_1.walletOrders.user_id,
        user_name: schema_1.users.name,
        user_phone: schema_1.users.phone,
        status: schema_1.walletOrders.status,
        reject_reason: schema_1.walletOrders.reject_reason,
        receipt: schema_1.walletOrders.receipt,
        createdAt: schema_1.walletOrders.createdAt,
        updatedAt: schema_1.walletOrders.updatedAt,
    })
        .from(schema_1.walletOrders)
        .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.walletOrders.user_id, schema_1.users.id))
        .where(whereClause)
        .limit(limit)
        .offset(offset);
    return (0, response_1.SuccessResponse)(res, {
        wallet_orders: list,
        pagination: (0, pagination_1.buildPaginationMeta)(total, page, limit),
    }, 200);
}
// 2. Relational Lists Endpoint: fetch users [id, name, phone]
async function getWalletOrdersLists(req, res) {
    const usersList = await db_1.db
        .select({
        id: schema_1.users.id,
        name: schema_1.users.name,
        phone: schema_1.users.phone,
    })
        .from(schema_1.users);
    return (0, response_1.SuccessResponse)(res, { users: usersList }, 200);
}
// 3. Get Wallet Order By ID
async function getWalletOrderById(req, res) {
    const { id } = req.params;
    const row = await db_1.db
        .select({
        id: schema_1.walletOrders.id,
        wallet: schema_1.walletOrders.wallet,
        user_id: schema_1.walletOrders.user_id,
        user_name: schema_1.users.name,
        user_phone: schema_1.users.phone,
        status: schema_1.walletOrders.status,
        reject_reason: schema_1.walletOrders.reject_reason,
        receipt: schema_1.walletOrders.receipt,
        createdAt: schema_1.walletOrders.createdAt,
        updatedAt: schema_1.walletOrders.updatedAt,
    })
        .from(schema_1.walletOrders)
        .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.walletOrders.user_id, schema_1.users.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.walletOrders.id, id), (0, drizzle_orm_1.ne)(schema_1.walletOrders.status, "faild")))
        .limit(1);
    if (!row[0])
        throw new Errors_1.NotFound("Wallet order not found");
    return (0, response_1.SuccessResponse)(res, { wallet_order: row[0] }, 200);
}
// 4. Create Wallet Order
async function createWalletOrder(req, res) {
    const { wallet, user_id, receipt } = req.body;
    // Verify user exists
    const user = await db_1.db.select({ id: schema_1.users.id }).from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, user_id)).limit(1);
    if (!user[0])
        throw new Errors_1.NotFound("User not found");
    const receiptUrl = receipt ? await (0, handleImages_1.uploadImage)(req, receipt, "wallet_orders") : null;
    await db_1.db.insert(schema_1.walletOrders).values({
        wallet: String(wallet),
        user_id,
        status: "pending",
        receipt: receiptUrl || null,
    });
    return (0, response_1.SuccessResponse)(res, { message: "Wallet order created successfully" }, 201);
}
// Shared helper to atomically approve a wallet order and credit the user's wallet
async function approveWalletOrderRecord(order, options) {
    return await db_1.db.transaction(async (tx) => {
        const [latestOrder] = await tx
            .select({ status: schema_1.walletOrders.status })
            .from(schema_1.walletOrders)
            .where((0, drizzle_orm_1.eq)(schema_1.walletOrders.id, order.id))
            .limit(1);
        if (!latestOrder) {
            throw new Errors_1.NotFound("Wallet order not found");
        }
        if (latestOrder.status === "approve") {
            if (options?.idempotent) {
                const [userRow] = await tx
                    .select({ wallet: schema_1.users.wallet })
                    .from(schema_1.users)
                    .where((0, drizzle_orm_1.eq)(schema_1.users.id, order.user_id))
                    .limit(1);
                return {
                    alreadyApproved: true,
                    user_wallet: userRow?.wallet,
                };
            }
            throw new Errors_1.BadRequest("Wallet order is already approved");
        }
        await tx
            .update(schema_1.users)
            .set({
            wallet: (0, drizzle_orm_1.sql) `${schema_1.users.wallet} + ${order.wallet}`,
        })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, order.user_id));
        await tx
            .update(schema_1.walletOrders)
            .set({
            status: "approve",
            reject_reason: null,
        })
            .where((0, drizzle_orm_1.eq)(schema_1.walletOrders.id, order.id));
        const [userRow] = await tx
            .select({ wallet: schema_1.users.wallet })
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, order.user_id))
            .limit(1);
        return {
            alreadyApproved: false,
            user_wallet: userRow?.wallet,
        };
    });
}
// 5. Change Wallet Order Status (Approve or Reject)
async function changeWalletOrderStatus(req, res) {
    const { id } = req.params;
    const { status, reject_reason } = req.body;
    const orderRows = await db_1.db
        .select()
        .from(schema_1.walletOrders)
        .where((0, drizzle_orm_1.eq)(schema_1.walletOrders.id, id))
        .limit(1);
    if (!orderRows[0])
        throw new Errors_1.NotFound("Wallet order not found");
    const order = orderRows[0];
    if (status === "reject") {
        if (!reject_reason || reject_reason.trim().length === 0) {
            throw new Errors_1.BadRequest("reject_reason is required when rejecting a wallet order");
        }
        await db_1.db
            .update(schema_1.walletOrders)
            .set({
            status: "reject",
            reject_reason,
        })
            .where((0, drizzle_orm_1.eq)(schema_1.walletOrders.id, id));
        return (0, response_1.SuccessResponse)(res, { message: "Wallet order rejected successfully", status: "reject", reject_reason }, 200);
    }
    if (status === "approve") {
        const { user_wallet: updatedWallet } = await approveWalletOrderRecord(order);
        return (0, response_1.SuccessResponse)(res, {
            message: "Wallet order approved successfully and user wallet credited",
            status: "approve",
            added_wallet: order.wallet,
            user_wallet: updatedWallet,
        }, 200);
    }
    throw new Errors_1.BadRequest("Invalid status");
}
// 6. Delete Wallet Order
async function deleteWalletOrder(req, res) {
    const { id } = req.params;
    const existing = await db_1.db.select().from(schema_1.walletOrders).where((0, drizzle_orm_1.eq)(schema_1.walletOrders.id, id)).limit(1);
    if (!existing[0])
        throw new Errors_1.NotFound("Wallet order not found");
    if (existing[0].receipt) {
        await (0, handleImages_1.deleteImage)(existing[0].receipt);
    }
    await db_1.db.delete(schema_1.walletOrders).where((0, drizzle_orm_1.eq)(schema_1.walletOrders.id, id));
    return (0, response_1.SuccessResponse)(res, { message: "Wallet order deleted successfully" }, 200);
}
// 7. Bulk Delete Wallet Orders
async function bulkDeleteWalletOrders(req, res) {
    const { ids } = req.body;
    const existing = await db_1.db.select().from(schema_1.walletOrders).where((0, drizzle_orm_1.inArray)(schema_1.walletOrders.id, ids));
    if (existing.length === 0) {
        return (0, response_1.SuccessResponse)(res, { message: "No matching wallet orders found", deletedCount: 0 }, 200);
    }
    for (const order of existing) {
        if (order.receipt) {
            await (0, handleImages_1.deleteImage)(order.receipt);
        }
    }
    await db_1.db.delete(schema_1.walletOrders).where((0, drizzle_orm_1.inArray)(schema_1.walletOrders.id, ids));
    return (0, response_1.SuccessResponse)(res, {
        message: `${existing.length} wallet order(s) deleted successfully`,
        deletedCount: existing.length,
    }, 200);
}
