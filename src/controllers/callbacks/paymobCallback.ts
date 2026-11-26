import { Request, Response } from "express";
import crypto from "crypto";
import { db } from "../../models/db";
import { paymob, userOrders, walletOrders } from "../../models/schema";
import { eq, inArray } from "drizzle-orm";
import { BadRequest, NotFound, UnauthorizedError } from "../../Errors";
import { SuccessResponse } from "../../utils/response";
import { approveUserOrderRecord } from "../super_admin/userOrders";
import { approveWalletOrderRecord } from "../super_admin/walletOrders";

function parseBool(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return false;
}

function buildPaymobConcatenatedString(req: Request): {
  concatenated: string;
  txId: string | null;
  paymobOrderId: string | null;
  txData: Record<string, unknown>;
} {
  // POST webhook sends nested `req.body.obj`
  if (req.body?.obj && typeof req.body.obj === "object") {
    const obj = req.body.obj as Record<string, any>;
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
      paymobOrderId:
        obj.order?.id !== undefined && obj.order?.id !== null ? String(obj.order.id) : null,
      txData: obj,
    };
  }

  // GET redirect callback sends flat query parameters (`source_data.pan`, `order`, etc.)
  const query = req.query as Record<string, unknown>;
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
    paymobOrderId:
      rawOrderId !== undefined && rawOrderId !== null ? String(rawOrderId) : null,
    txData: query,
  };
}

// Paymob Callback Handler (POST webhook & GET redirect)
export async function paymobCallback(req: Request, res: Response) {
  const [paymobSettings] = await db.select().from(paymob).limit(1);
  if (!paymobSettings || !paymobSettings.hmac) {
    throw new BadRequest("Paymob configuration is not set up");
  }

  const receivedHmac = String(
    req.query.hmac || req.body?.hmac || req.body?.obj?.hmac || ""
  ).trim();

  if (!receivedHmac) {
    throw new UnauthorizedError("Missing Paymob HMAC signature");
  }

  const { concatenated, txId, paymobOrderId, txData } = buildPaymobConcatenatedString(req);

  const calculatedHmac = crypto
    .createHmac("sha512", paymobSettings.hmac)
    .update(concatenated)
    .digest("hex");

  const expectedBuf = Buffer.from(calculatedHmac.toLowerCase(), "utf8");
  const receivedBuf = Buffer.from(receivedHmac.toLowerCase(), "utf8");

  if (
    expectedBuf.length !== receivedBuf.length ||
    !crypto.timingSafeEqual(expectedBuf, receivedBuf)
  ) {
    throw new UnauthorizedError("Invalid Paymob HMAC signature");
  }

  const candidateIds = Array.from(
    new Set([txId, paymobOrderId].filter((v): v is string => Boolean(v)))
  );

  if (candidateIds.length === 0) {
    throw new BadRequest("Missing Paymob transaction_id in callback payload");
  }

  const [userOrder] = await db
    .select()
    .from(userOrders)
    .where(inArray(userOrders.transaction_id, candidateIds))
    .limit(1);

  const [walletOrder] = userOrder
    ? [undefined]
    : await db
        .select()
        .from(walletOrders)
        .where(inArray(walletOrders.transaction_id, candidateIds))
        .limit(1);

  if (!userOrder && !walletOrder) {
    throw new NotFound("Order not found for this Paymob transaction");
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
      const result = await approveUserOrderRecord(userOrder, { idempotent: true });
      return SuccessResponse(
        res,
        {
          gateway: "paymob",
          order_type: "user_order",
          order_id: userOrder.id,
          transaction_id: userOrder.transaction_id,
          status: "approve",
          already_processed: result.alreadyApproved,
          subscription: result.subscription,
        },
        200
      );
    }

    if (isFailed && userOrder.status !== "approve") {
      await db
        .update(userOrders)
        .set({ status: "faild" })
        .where(eq(userOrders.id, userOrder.id));

      return SuccessResponse(
        res,
        {
          gateway: "paymob",
          order_type: "user_order",
          order_id: userOrder.id,
          transaction_id: userOrder.transaction_id,
          status: "faild",
          message: "Payment failed",
        },
        200
      );
    }

    return SuccessResponse(
      res,
      {
        gateway: "paymob",
        order_type: "user_order",
        order_id: userOrder.id,
        transaction_id: userOrder.transaction_id,
        status: userOrder.status,
        message: isPending ? "Payment is still pending" : "Callback processed",
      },
      200
    );
  }

  // Wallet Order path
  const targetWalletOrder = walletOrder!;

  if (isCapturedSuccess) {
    const result = await approveWalletOrderRecord(targetWalletOrder, { idempotent: true });
    return SuccessResponse(
      res,
      {
        gateway: "paymob",
        order_type: "wallet_order",
        order_id: targetWalletOrder.id,
        transaction_id: targetWalletOrder.transaction_id,
        status: "approve",
        already_processed: result.alreadyApproved,
        added_wallet: targetWalletOrder.wallet,
        user_wallet: result.user_wallet,
      },
      200
    );
  }

  if (isFailed && targetWalletOrder.status !== "approve") {
    await db
      .update(walletOrders)
      .set({ status: "faild" })
      .where(eq(walletOrders.id, targetWalletOrder.id));

    return SuccessResponse(
      res,
      {
        gateway: "paymob",
        order_type: "wallet_order",
        order_id: targetWalletOrder.id,
        transaction_id: targetWalletOrder.transaction_id,
        status: "faild",
        message: "Payment failed",
      },
      200
    );
  }

  return SuccessResponse(
    res,
    {
      gateway: "paymob",
      order_type: "wallet_order",
      order_id: targetWalletOrder.id,
      transaction_id: targetWalletOrder.transaction_id,
      status: targetWalletOrder.status,
      message: isPending ? "Payment is still pending" : "Callback processed",
    },
    200
  );
}
