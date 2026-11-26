import { Request, Response } from "express";
import { db } from "../../models/db";
import { walletOrders, users } from "../../models/schema";
import { eq, and, gte, lte, inArray, sql, SQL } from "drizzle-orm";
import { NotFound, BadRequest } from "../../Errors";
import { SuccessResponse } from "../../utils/response";
import { getPaginationParams, buildPaginationMeta } from "../../utils/pagination";
import { uploadImage, deleteImage } from "../../utils/handleImages";

// 1. Get All Wallet Orders (Paginated with filters: user_id, status, from, to date range)
export async function getAllWalletOrders(req: Request, res: Response) {
  const { page, limit, offset } = getPaginationParams(req);
  const { user_id, status, from, to } = req.query;

  const conditions: SQL[] = [];

  if (user_id && typeof user_id === "string") {
    conditions.push(eq(walletOrders.user_id, user_id));
  }
  if (status && typeof status === "string") {
    conditions.push(eq(walletOrders.status, status as any));
  }
  if (from && typeof from === "string") {
    conditions.push(gte(walletOrders.createdAt, new Date(from)));
  }
  if (to && typeof to === "string") {
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);
    conditions.push(lte(walletOrders.createdAt, toDate));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult] = await db
    .select({ total: sql<number>`count(*)` })
    .from(walletOrders)
    .where(whereClause);
  const total = Number(countResult?.total || 0);

  const list = await db
    .select({
      id: walletOrders.id,
      wallet: walletOrders.wallet,
      user_id: walletOrders.user_id,
      user_name: users.name,
      user_phone: users.phone,
      status: walletOrders.status,
      reject_reason: walletOrders.reject_reason,
      receipt: walletOrders.receipt,
      createdAt: walletOrders.createdAt,
      updatedAt: walletOrders.updatedAt,
    })
    .from(walletOrders)
    .leftJoin(users, eq(walletOrders.user_id, users.id))
    .where(whereClause)
    .limit(limit)
    .offset(offset);

  return SuccessResponse(
    res,
    {
      wallet_orders: list,
      pagination: buildPaginationMeta(total, page, limit),
    },
    200
  );
}

// 2. Relational Lists Endpoint: fetch users [id, name, phone]
export async function getWalletOrdersLists(req: Request, res: Response) {
  const usersList = await db
    .select({
      id: users.id,
      name: users.name,
      phone: users.phone,
    })
    .from(users);

  return SuccessResponse(res, { users: usersList }, 200);
}

// 3. Get Wallet Order By ID
export async function getWalletOrderById(req: Request, res: Response) {
  const { id } = req.params;

  const row = await db
    .select({
      id: walletOrders.id,
      wallet: walletOrders.wallet,
      user_id: walletOrders.user_id,
      user_name: users.name,
      user_phone: users.phone,
      status: walletOrders.status,
      reject_reason: walletOrders.reject_reason,
      receipt: walletOrders.receipt,
      createdAt: walletOrders.createdAt,
      updatedAt: walletOrders.updatedAt,
    })
    .from(walletOrders)
    .leftJoin(users, eq(walletOrders.user_id, users.id))
    .where(eq(walletOrders.id, id))
    .limit(1);

  if (!row[0]) throw new NotFound("Wallet order not found");

  return SuccessResponse(res, { wallet_order: row[0] }, 200);
}

// 4. Create Wallet Order
export async function createWalletOrder(req: Request, res: Response) {
  const { wallet, user_id, receipt } = req.body;

  // Verify user exists
  const user = await db.select({ id: users.id }).from(users).where(eq(users.id, user_id)).limit(1);
  if (!user[0]) throw new NotFound("User not found");

  const receiptUrl = receipt ? await uploadImage(req, receipt, "wallet_orders") : null;

  await db.insert(walletOrders).values({
    wallet: String(wallet),
    user_id,
    status: "pending",
    receipt: receiptUrl || null,
  });

  return SuccessResponse(res, { message: "Wallet order created successfully" }, 201);
}

// 5. Change Wallet Order Status (Approve or Reject)
export async function changeWalletOrderStatus(req: Request, res: Response) {
  const { id } = req.params;
  const { status, reject_reason } = req.body;

  const orderRows = await db
    .select()
    .from(walletOrders)
    .where(eq(walletOrders.id, id))
    .limit(1);

  if (!orderRows[0]) throw new NotFound("Wallet order not found");

  const order = orderRows[0];

  if (status === "reject") {
    if (!reject_reason || reject_reason.trim().length === 0) {
      throw new BadRequest("reject_reason is required when rejecting a wallet order");
    }

    await db
      .update(walletOrders)
      .set({
        status: "reject",
        reject_reason,
      })
      .where(eq(walletOrders.id, id));

    return SuccessResponse(
      res,
      { message: "Wallet order rejected successfully", status: "reject", reject_reason },
      200
    );
  }

  if (status === "approve") {
    if (order.status === "approve") {
      throw new BadRequest("Wallet order is already approved");
    }

    const updatedWallet = await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({
          wallet: sql`${users.wallet} + ${order.wallet}`,
        })
        .where(eq(users.id, order.user_id));

      await tx
        .update(walletOrders)
        .set({
          status: "approve",
          reject_reason: null,
        })
        .where(eq(walletOrders.id, id));

      const [userRow] = await tx
        .select({ wallet: users.wallet })
        .from(users)
        .where(eq(users.id, order.user_id))
        .limit(1);

      return userRow?.wallet;
    });

    return SuccessResponse(
      res,
      {
        message: "Wallet order approved successfully and user wallet credited",
        status: "approve",
        added_wallet: order.wallet,
        user_wallet: updatedWallet,
      },
      200
    );
  }

  throw new BadRequest("Invalid status");
}

// 6. Delete Wallet Order
export async function deleteWalletOrder(req: Request, res: Response) {
  const { id } = req.params;

  const existing = await db.select().from(walletOrders).where(eq(walletOrders.id, id)).limit(1);
  if (!existing[0]) throw new NotFound("Wallet order not found");

  if (existing[0].receipt) {
    await deleteImage(existing[0].receipt);
  }

  await db.delete(walletOrders).where(eq(walletOrders.id, id));

  return SuccessResponse(res, { message: "Wallet order deleted successfully" }, 200);
}

// 7. Bulk Delete Wallet Orders
export async function bulkDeleteWalletOrders(req: Request, res: Response) {
  const { ids } = req.body as { ids: string[] };

  const existing = await db.select().from(walletOrders).where(inArray(walletOrders.id, ids));
  if (existing.length === 0) {
    return SuccessResponse(res, { message: "No matching wallet orders found", deletedCount: 0 }, 200);
  }

  for (const order of existing) {
    if (order.receipt) {
      await deleteImage(order.receipt);
    }
  }

  await db.delete(walletOrders).where(inArray(walletOrders.id, ids));

  return SuccessResponse(
    res,
    {
      message: `${existing.length} wallet order(s) deleted successfully`,
      deletedCount: existing.length,
    },
    200
  );
}
