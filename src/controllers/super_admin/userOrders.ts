import { Request, Response } from "express";
import { db } from "../../models/db";
import { userOrders, users, packages, discounts } from "../../models/schema";
import { eq, and, gte, lte, inArray, sql, SQL } from "drizzle-orm";
import { NotFound, BadRequest } from "../../Errors";
import { SuccessResponse } from "../../utils/response";
import { getLocalizedText } from "../../utils/localization";
import { calculateSubscriptionEndDate } from "../../utils/subscription";
import { getPaginationParams, buildPaginationMeta } from "../../utils/pagination";

// 1. Get All User Orders (Paginated with filters: user_id, package_id, status, from, to date range)
export async function getAllUserOrders(req: Request, res: Response) {
  const lang = req.query.lang as string | undefined;
  const { page, limit, offset } = getPaginationParams(req);
  const { user_id, package_id, status, from, to } = req.query;

  const conditions: SQL[] = [];

  if (user_id && typeof user_id === "string") {
    conditions.push(eq(userOrders.user_id, user_id));
  }
  if (package_id && typeof package_id === "string") {
    conditions.push(eq(userOrders.package_id, package_id));
  }
  if (status && typeof status === "string") {
    conditions.push(eq(userOrders.status, status as any));
  }
  if (from && typeof from === "string") {
    conditions.push(gte(userOrders.createdAt, new Date(from)));
  }
  if (to && typeof to === "string") {
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);
    conditions.push(lte(userOrders.createdAt, toDate));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult] = await db
    .select({ total: sql<number>`count(*)` })
    .from(userOrders)
    .where(whereClause);
  const total = Number(countResult?.total || 0);

  const list = await db
    .select({
      id: userOrders.id,
      price: userOrders.price,
      discount: userOrders.discount,
      final_price: userOrders.final_price,
      user_id: userOrders.user_id,
      user_name: users.name,
      user_phone: users.phone,
      package_id: userOrders.package_id,
      package_name: packages.name,
      discount_id: userOrders.discount_id,
      discount_name: discounts.name,
      status: userOrders.status,
      reject_reason: userOrders.reject_reason,
      createdAt: userOrders.createdAt,
      updatedAt: userOrders.updatedAt,
    })
    .from(userOrders)
    .leftJoin(users, eq(userOrders.user_id, users.id))
    .leftJoin(packages, eq(userOrders.package_id, packages.id))
    .leftJoin(discounts, eq(userOrders.discount_id, discounts.id))
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
    package_name: item.package_name ? getLocalizedText(item.package_name, lang) : null,
    discount_id: item.discount_id,
    discount_name: item.discount_name ? getLocalizedText(item.discount_name, lang) : null,
    status: item.status,
    reject_reason: item.reject_reason,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));

  return SuccessResponse(
    res,
    {
      user_orders: formatted,
      pagination: buildPaginationMeta(total, page, limit),
    },
    200
  );
}

// 2. Relational Lists Endpoint: fetch users [id, name, phone] and packages [id, name localized]
export async function getUserOrdersLists(req: Request, res: Response) {
  const lang = req.query.lang as string | undefined;

  const usersList = await db
    .select({
      id: users.id,
      name: users.name,
      phone: users.phone,
    })
    .from(users);

  const packagesList = await db
    .select({
      id: packages.id,
      name: packages.name,
      type: packages.type,
      price: packages.price,
    })
    .from(packages)
    .where(eq(packages.status, true));

  const formattedPackages = packagesList.map((pkg) => ({
    id: pkg.id,
    name: getLocalizedText(pkg.name, lang),
    type: pkg.type,
    price: pkg.price,
  }));

  const discountsList = await db
    .select({
      id: discounts.id,
      name: discounts.name,
      amount: discounts.amount,
      type: discounts.type,
    })
    .from(discounts);

  const formattedDiscounts = discountsList.map((d) => ({
    id: d.id,
    name: getLocalizedText(d.name, lang),
    amount: d.amount,
    type: d.type,
  }));

  return SuccessResponse(
    res,
    {
      users: usersList,
      packages: formattedPackages,
      discounts: formattedDiscounts,
    },
    200
  );
}

// 3. Get User Order By ID
export async function getUserOrderById(req: Request, res: Response) {
  const { id } = req.params;
  const lang = req.query.lang as string | undefined;

  const row = await db
    .select({
      id: userOrders.id,
      price: userOrders.price,
      discount: userOrders.discount,
      final_price: userOrders.final_price,
      user_id: userOrders.user_id,
      user_name: users.name,
      user_phone: users.phone,
      package_id: userOrders.package_id,
      package_name: packages.name,
      discount_id: userOrders.discount_id,
      discount_name: discounts.name,
      status: userOrders.status,
      reject_reason: userOrders.reject_reason,
      createdAt: userOrders.createdAt,
      updatedAt: userOrders.updatedAt,
    })
    .from(userOrders)
    .leftJoin(users, eq(userOrders.user_id, users.id))
    .leftJoin(packages, eq(userOrders.package_id, packages.id))
    .leftJoin(discounts, eq(userOrders.discount_id, discounts.id))
    .where(eq(userOrders.id, id))
    .limit(1);

  if (!row[0]) throw new NotFound("Order not found");

  const formatted = {
    ...row[0],
    package_name: row[0].package_name ? getLocalizedText(row[0].package_name, lang) : null,
    discount_name: row[0].discount_name ? getLocalizedText(row[0].discount_name, lang) : null,
  };

  return SuccessResponse(res, { user_order: formatted }, 200);
}

// 4. Create User Order
export async function createUserOrder(req: Request, res: Response) {
  const { package_id, discount_id, price, discount, final_price, user_id } = req.body;

  // Verify user exists
  const user = await db.select({ id: users.id }).from(users).where(eq(users.id, user_id)).limit(1);
  if (!user[0]) throw new NotFound("User not found");

  // Verify package exists
  const pkg = await db.select({ id: packages.id }).from(packages).where(eq(packages.id, package_id)).limit(1);
  if (!pkg[0]) throw new NotFound("Package not found");

  await db.insert(userOrders).values({
    package_id,
    discount_id: discount_id ?? null,
    price: String(price),
    discount: String(discount ?? 0),
    final_price: String(final_price),
    user_id,
    status: "pending",
  });

  return SuccessResponse(res, { message: "User order created successfully" }, 201);
}

// 5. Change Order Status (Approve or Reject)
export async function changeUserOrderStatus(req: Request, res: Response) {
  const { id } = req.params;
  const { status, reject_reason } = req.body;

  const orderRows = await db
    .select()
    .from(userOrders)
    .where(eq(userOrders.id, id))
    .limit(1);

  if (!orderRows[0]) throw new NotFound("Order not found");

  const order = orderRows[0];

  if (status === "reject") {
    if (!reject_reason || reject_reason.trim().length === 0) {
      throw new BadRequest("reject_reason is required when rejecting an order");
    }

    await db
      .update(userOrders)
      .set({
        status: "reject",
        reject_reason,
      })
      .where(eq(userOrders.id, id));

    return SuccessResponse(
      res,
      { message: "Order rejected successfully", status: "reject", reject_reason },
      200
    );
  }

  if (status === "approve") {
    // Fetch package to calculate dates based on its type
    const pkgRows = await db
      .select()
      .from(packages)
      .where(eq(packages.id, order.package_id))
      .limit(1);

    if (!pkgRows[0]) {
      throw new NotFound("Associated package not found");
    }

    const now = new Date();
    const startDateStr = now.toISOString().split("T")[0];
    const endDateStr = calculateSubscriptionEndDate(now, pkgRows[0].type);

    // 1. Update user: package_id, start_date = now(), end_date based on package type
    await db
      .update(users)
      .set({
        package_id: order.package_id,
        start_date: startDateStr,
        end_date: endDateStr,
      })
      .where(eq(users.id, order.user_id));

    // 2. Update order status: approve
    await db
      .update(userOrders)
      .set({
        status: "approve",
        reject_reason: null,
      })
      .where(eq(userOrders.id, id));

    return SuccessResponse(
      res,
      {
        message: "Order approved successfully and user subscription activated",
        status: "approve",
        subscription: {
          package_id: order.package_id,
          package_type: pkgRows[0].type,
          start_date: startDateStr,
          end_date: endDateStr,
        },
      },
      200
    );
  }

  throw new BadRequest("Invalid status");
}

// 6. Delete User Order
export async function deleteUserOrder(req: Request, res: Response) {
  const { id } = req.params;

  const existing = await db.select().from(userOrders).where(eq(userOrders.id, id)).limit(1);
  if (!existing[0]) throw new NotFound("Order not found");

  await db.delete(userOrders).where(eq(userOrders.id, id));

  return SuccessResponse(res, { message: "Order deleted successfully" }, 200);
}

// 7. Bulk Delete User Orders
export async function bulkDeleteUserOrders(req: Request, res: Response) {
  const { ids } = req.body as { ids: string[] };

  const existing = await db.select().from(userOrders).where(inArray(userOrders.id, ids));
  if (existing.length === 0) {
    return SuccessResponse(res, { message: "No matching orders found", deletedCount: 0 }, 200);
  }

  await db.delete(userOrders).where(inArray(userOrders.id, ids));

  return SuccessResponse(
    res,
    {
      message: `${existing.length} order(s) deleted successfully`,
      deletedCount: existing.length,
    },
    200
  );
}
