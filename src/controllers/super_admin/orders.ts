import { Request, Response } from "express";
import { db } from "../../models/db";
import { orders, users } from "../../models/schema";
import { eq, and, gte, lte, sql, SQL } from "drizzle-orm";
import { BadRequest } from "../../Errors";
import { SuccessResponse } from "../../utils/response";
import { getPaginationParams, buildPaginationMeta } from "../../utils/pagination";

function normalizeOptionalQueryParam(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === "null") return null;
  return trimmed;
}

// 1. Get Aggregated Orders by User with Optional Filters (user_id, from, to)
export async function getAllOrders(req: Request, res: Response) {
  const { page, limit, offset } = getPaginationParams(req);

  const userId = normalizeOptionalQueryParam(req.query.user_id);
  const fromParam = normalizeOptionalQueryParam(req.query.from);
  const toParam = normalizeOptionalQueryParam(req.query.to);

  const conditions: SQL[] = [];

  if (userId) {
    conditions.push(eq(orders.user_id, userId));
  }

  if (fromParam) {
    const fromDate = new Date(fromParam);
    if (Number.isNaN(fromDate.getTime())) {
      throw new BadRequest("Invalid 'from' date");
    }
    conditions.push(gte(orders.createdAt, fromDate));
  }

  if (toParam) {
    const toDate = new Date(toParam);
    if (Number.isNaN(toDate.getTime())) {
      throw new BadRequest("Invalid 'to' date");
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(toParam)) {
      toDate.setHours(23, 59, 59, 999);
    }
    conditions.push(lte(orders.createdAt, toDate));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult] = await db
    .select({ total: sql<number>`COUNT(DISTINCT ${orders.user_id})` })
    .from(orders)
    .where(whereClause);
  const total = Number(countResult?.total || 0);

  const list = await db
    .select({
      user_id: orders.user_id,
      total_orders: sql<string>`COALESCE(SUM(${orders.total}), 0)`,
      name: users.name,
      email: users.email,
      phone: users.phone,
    })
    .from(orders)
    .innerJoin(users, eq(orders.user_id, users.id))
    .where(whereClause)
    .groupBy(orders.user_id, users.name, users.email, users.phone)
    .limit(limit)
    .offset(offset);

  const formatted = list.map((row) => ({
    user_id: row.user_id,
    total_orders: Number(Number(row.total_orders || 0).toFixed(2)),
    name: row.name,
    email: row.email,
    phone: row.phone,
  }));

  return SuccessResponse(
    res,
    {
      orders: formatted,
      pagination: buildPaginationMeta(total, page, limit),
    },
    200
  );
}

// 2. Relational Lists Endpoint: fetch users [id, name, phone]
export async function getOrdersLists(req: Request, res: Response) {
  const usersList = await db
    .select({
      id: users.id,
      name: users.name,
      phone: users.phone,
    })
    .from(users);

  return SuccessResponse(res, { users: usersList }, 200);
}
