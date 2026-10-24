import { Request, Response } from "express";
import { db } from "../../models/db";
import { discounts } from "../../models/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { NotFound } from "../../Errors";
import { SuccessResponse } from "../../utils/response";
import { getLocalizedText, parseJsonIfNeeded } from "../../utils/localization";
import { getPaginationParams, buildPaginationMeta } from "../../utils/pagination";

// 1. Get All Discounts (Paginated, localized name)
export async function getAllDiscounts(req: Request, res: Response) {
  const lang = req.query.lang as string | undefined;
  const { page, limit, offset } = getPaginationParams(req);

  const [countResult] = await db.select({ total: sql<number>`count(*)` }).from(discounts);
  const total = Number(countResult?.total || 0);

  const list = await db.select().from(discounts).limit(limit).offset(offset);

  const formatted = list.map((item) => ({
    id: item.id,
    name: getLocalizedText(item.name, lang),
    names: parseJsonIfNeeded(item.name),
    amount: item.amount,
    type: item.type,
    start_date: item.start_date,
    end_date: item.end_date,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));

  return SuccessResponse(
    res,
    {
      discounts: formatted,
      pagination: buildPaginationMeta(total, page, limit),
    },
    200
  );
}

// 2. Get Discounts Selection for Dropdowns (id, name localized)
export async function getDiscountsSelection(req: Request, res: Response) {
  const lang = req.query.lang as string | undefined;

  const list = await db
    .select({
      id: discounts.id,
      name: discounts.name,
      amount: discounts.amount,
      type: discounts.type,
    })
    .from(discounts);

  const formatted = list.map((item) => ({
    id: item.id,
    name: getLocalizedText(item.name, lang),
    amount: item.amount,
    type: item.type,
  }));

  return SuccessResponse(res, { discounts: formatted }, 200);
}

// 3. Get Discount By ID
export async function getDiscountById(req: Request, res: Response) {
  const { id } = req.params;
  const lang = req.query.lang as string | undefined;

  const row = await db.select().from(discounts).where(eq(discounts.id, id)).limit(1);
  if (!row[0]) throw new NotFound("Discount not found");

  const formatted = {
    id: row[0].id,
    name: getLocalizedText(row[0].name, lang),
    names: parseJsonIfNeeded(row[0].name),
    amount: row[0].amount,
    type: row[0].type,
    start_date: row[0].start_date,
    end_date: row[0].end_date,
    createdAt: row[0].createdAt,
    updatedAt: row[0].updatedAt,
  };

  return SuccessResponse(res, { discount: formatted }, 200);
}

// 4. Create Discount
export async function createDiscount(req: Request, res: Response) {
  const { name, amount, type, start_date, end_date } = req.body;

  await db.insert(discounts).values({
    name: parseJsonIfNeeded(name),
    amount: String(amount),
    type,
    start_date,
    end_date,
  });

  return SuccessResponse(res, { message: "Discount created successfully" }, 201);
}

// 5. Update Discount
export async function updateDiscount(req: Request, res: Response) {
  const { id } = req.params;
  const { name, amount, type, start_date, end_date } = req.body;

  const existing = await db.select().from(discounts).where(eq(discounts.id, id)).limit(1);
  if (!existing[0]) throw new NotFound("Discount not found");

  const updateData: Partial<typeof discounts.$inferInsert> = {};
  if (name !== undefined) updateData.name = parseJsonIfNeeded(name);
  if (amount !== undefined) updateData.amount = String(amount);
  if (type !== undefined) updateData.type = type;
  if (start_date !== undefined) updateData.start_date = start_date;
  if (end_date !== undefined) updateData.end_date = end_date;

  if (Object.keys(updateData).length > 0) {
    await db.update(discounts).set(updateData).where(eq(discounts.id, id));
  }

  return SuccessResponse(res, { message: "Discount updated successfully" }, 200);
}

// 6. Delete Discount
export async function deleteDiscount(req: Request, res: Response) {
  const { id } = req.params;

  const existing = await db.select().from(discounts).where(eq(discounts.id, id)).limit(1);
  if (!existing[0]) throw new NotFound("Discount not found");

  await db.delete(discounts).where(eq(discounts.id, id));

  return SuccessResponse(res, { message: "Discount deleted successfully" }, 200);
}

// 7. Bulk Delete Discounts
export async function bulkDeleteDiscounts(req: Request, res: Response) {
  const { ids } = req.body as { ids: string[] };

  const existing = await db.select().from(discounts).where(inArray(discounts.id, ids));
  if (existing.length === 0) {
    return SuccessResponse(res, { message: "No matching discounts found", deletedCount: 0 }, 200);
  }

  await db.delete(discounts).where(inArray(discounts.id, ids));

  return SuccessResponse(
    res,
    {
      message: `${existing.length} discount(s) deleted successfully`,
      deletedCount: existing.length,
    },
    200
  );
}
