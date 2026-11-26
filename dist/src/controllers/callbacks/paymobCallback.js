"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymobCallback = paymobCallback;
const crypto_1 = __importDefault(require("crypto"));
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const Errors_1 = require("../../Errors");
const response_1 = require("../../utils/response");
const userOrders_1 = require("../super_admin/userOrders");
const walletOrders_1 = require("../super_admin/walletOrders");
function parseBool(value) {
    if (typeof value === "boolean")
        return value;
    if (typeof value === "string")
        return value.toLowerCase() === "true";
    return false;
}
function buildPaymobConcatenatedString(req) {
    // POST webhook sends nested `req.body.obj`
    if (req.body?.obj && typeof req.body.obj === "object") {
        const obj = req.body.obj;
        const concatenated = [
            obj.amount_cents,
            obj.created_at,
            obj.currency,
            obj.error_occured,
            obj.has_parent_transaction,
            obj.id,
            obj.integration_id,
            obj.is_3d_secure,
            obj.is_auth,
            obj.is_capture,
            obj.is_refunded,
            obj.is_standalone_payment,
            obj.is_voided,
            obj.order?.id,
            obj.owner,
            obj.pending,
            obj.source_data?.pan,
            obj.source_data?.sub_type,
            obj.source_data?.type,
            obj.success,
        ]
            .map((val) => String(val ?? ""))
            .join("");
        return {
            concatenated,
            txId: obj.id !== undefined && obj.id !== null ? String(obj.id) : null,
            paymobOrderId: obj.order?.id !== undefined && obj.order?.id !== null ? String(obj.order.id) : null,
            txData: obj,
        };
    }
    // GET redirect callback sends flat query parameters (`source_data.pan`, `order`, etc.)
    const query = req.query;
    const concatenated = [
        query["amount_cents"],
        query["created_at"],
        query["currency"],
        query["error_occured"],
        query["has_parent_transaction"],
        query["id"],
        query["integration_id"],
        query["is_3d_secure"],
        query["is_auth"],
        query["is_capture"],
        query["is_refunded"],
        query["is_standalone_payment"],
        query["is_voided"],
        query["order"] ?? query["order.id"],
        query["owner"],
        query["pending"],
        query["source_data.pan"],
        query["source_data.sub_type"],
        query["source_data.type"],
        query["success"],
    ]
        .map((val) => String(val ?? ""))
        .join("");
    const rawOrderId = query["order"] ?? query["order.id"];
    return {
        concatenated,
        txId: query["id"] !== undefined && query["id"] !== null ? String(query["id"]) : null,
        paymobOrderId: rawOrderId !== undefined && rawOrderId !== null ? String(rawOrderId) : null,
        txData: query,
    };
}
// Paymob Callback Handler (POST webhook & GET redirect)
async function paymobCallback(req, res) {
    const [paymobSettings] = await db_1.db.select().from(schema_1.paymob).limit(1);
    if (!paymobSettings || !paymobSettings.hmac) {
        throw new Errors_1.BadRequest("Paymob configuration is not set up");
    }
    const receivedHmac = String(req.query.hmac || req.body?.hmac || req.body?.obj?.hmac || "").trim();
    if (!receivedHmac) {
        throw new Errors_1.UnauthorizedError("Missing Paymob HMAC signature");
    }
    const { concatenated, txId, paymobOrderId, txData } = buildPaymobConcatenatedString(req);
    const calculatedHmac = crypto_1.default
        .createHmac("sha512", paymobSettings.hmac)
        .update(concatenated)
        .digest("hex");
    const expectedBuf = Buffer.from(calculatedHmac.toLowerCase(), "utf8");
    const receivedBuf = Buffer.from(receivedHmac.toLowerCase(), "utf8");
    if (expectedBuf.length !== receivedBuf.length ||
        !crypto_1.default.timingSafeEqual(expectedBuf, receivedBuf)) {
        throw new Errors_1.UnauthorizedError("Invalid Paymob HMAC signature");
    }
    const candidateIds = Array.from(new Set([txId, paymobOrderId].filter((v) => Boolean(v))));
    if (candidateIds.length === 0) {
        throw new Errors_1.BadRequest("Missing Paymob transaction_id in callback payload");
    }
    const [userOrder] = await db_1.db
        .select()
        .from(schema_1.userOrders)
        .where((0, drizzle_orm_1.inArray)(schema_1.userOrders.transaction_id, candidateIds))
        .limit(1);
    const [walletOrder] = userOrder
        ? [undefined]
        : await db_1.db
            .select()
            .from(schema_1.walletOrders)
            .where((0, drizzle_orm_1.inArray)(schema_1.walletOrders.transaction_id, candidateIds))
            .limit(1);
    if (!userOrder && !walletOrder) {
        throw new Errors_1.NotFound("Order not found for this Paymob transaction");
    }
    const isSuccess = parseBool(txData.success);
    const isPending = parseBool(txData.pending);
    const hasError = parseBool(txData.error_occured);
    const isRefunded = parseBool(txData.is_refunded);
    const isVoided = parseBool(txData.is_voided);
    const isCapturedSuccess = isSuccess && !isPending && !hasError && !isRefunded && !isVoided;
    const isFailed = !isPending && (!isSuccess || hasError);
    if (userOrder) {
        if (isCapturedSuccess) {
            const result = await (0, userOrders_1.approveUserOrderRecord)(userOrder, { idempotent: true });
            return (0, response_1.SuccessResponse)(res, {
                gateway: "paymob",
                order_type: "user_order",
                order_id: userOrder.id,
                transaction_id: userOrder.transaction_id,
                status: "approve",
                already_processed: result.alreadyApproved,
                subscription: result.subscription,
            }, 200);
        }
        if (isFailed && userOrder.status !== "approve") {
            await db_1.db
                .update(schema_1.userOrders)
                .set({ status: "faild" })
                .where((0, drizzle_orm_1.eq)(schema_1.userOrders.id, userOrder.id));
            return (0, response_1.SuccessResponse)(res, {
                gateway: "paymob",
                order_type: "user_order",
                order_id: userOrder.id,
                transaction_id: userOrder.transaction_id,
                status: "faild",
                message: "Payment failed",
            }, 200);
        }
        return (0, response_1.SuccessResponse)(res, {
            gateway: "paymob",
            order_type: "user_order",
            order_id: userOrder.id,
            transaction_id: userOrder.transaction_id,
            status: userOrder.status,
            message: isPending ? "Payment is still pending" : "Callback processed",
        }, 200);
    }
    // Wallet Order path
    const targetWalletOrder = walletOrder;
    if (isCapturedSuccess) {
        const result = await (0, walletOrders_1.approveWalletOrderRecord)(targetWalletOrder, { idempotent: true });
        return (0, response_1.SuccessResponse)(res, {
            gateway: "paymob",
            order_type: "wallet_order",
            order_id: targetWalletOrder.id,
            transaction_id: targetWalletOrder.transaction_id,
            status: "approve",
            already_processed: result.alreadyApproved,
            added_wallet: targetWalletOrder.wallet,
            user_wallet: result.user_wallet,
        }, 200);
    }
    if (isFailed && targetWalletOrder.status !== "approve") {
        await db_1.db
            .update(schema_1.walletOrders)
            .set({ status: "faild" })
            .where((0, drizzle_orm_1.eq)(schema_1.walletOrders.id, targetWalletOrder.id));
        return (0, response_1.SuccessResponse)(res, {
            gateway: "paymob",
            order_type: "wallet_order",
            order_id: targetWalletOrder.id,
            transaction_id: targetWalletOrder.transaction_id,
            status: "faild",
            message: "Payment failed",
        }, 200);
    }
    return (0, response_1.SuccessResponse)(res, {
        gateway: "paymob",
        order_type: "wallet_order",
        order_id: targetWalletOrder.id,
        transaction_id: targetWalletOrder.transaction_id,
        status: targetWalletOrder.status,
        message: isPending ? "Payment is still pending" : "Callback processed",
    }, 200);
}
