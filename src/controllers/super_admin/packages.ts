import { Request, Response } from "express";
import { db } from "../../models/db";
import { packages } from "../../models/schema";
import { asc, eq, inArray, sql } from "drizzle-orm";
import { BadRequest, NotFound } from "../../Errors";
import { SuccessResponse } from "../../utils/response";
import { getLocalizedText, parseJsonIfNeeded } from "../../utils/localization";
import { getPaginationParams, buildPaginationMeta } from "../../utils/pagination";

// 1. Get All Packages (Paginated, localized name)
export async function getAllPackages(req: Request, res: Response) {
  const lang = req.query.lang as string | undefined;
  const { page, limit, offset } = getPaginationParams(req);

  const [countResult] = await db.select({ total: sql<number>`count(*)` }).from(packages);
  const total = Number(countResult?.total || 0);

  const list = await db
    .select()
    .from(packages)
    .orderBy(asc(packages.sort))
    .limit(limit)
    .offset(offset);

  const formatted = list.map((item) => ({
    id: item.id,
    name: getLocalizedText(item.name, lang),
    names: parseJsonIfNeeded(item.name),
    price: item.price,
    orders_from: item.orders_from,
    orders_to: item.orders_to,
    sort: item.sort,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));

  return SuccessResponse(
    res,
    {
      packages: formatted,
      pagination: buildPaginationMeta(total, page, limit),
    },
    200
  );
}

// 2. Get Packages Selection for Dropdowns (id, name localized)
export async function getPackagesSelection(req: Request, res: Response) {
  const lang = req.query.lang as string | undefined;

  const list = await db
    .select({
      id: packages.id,
      name: packages.name,
      price: packages.price,
      orders_from: packages.orders_from,
      orders_to: packages.orders_to,
      sort: packages.sort,
    })
    .from(packages)
    .orderBy(asc(packages.sort));

  const formatted = list.map((item) => ({
    id: item.id,
    name: getLocalizedText(item.name, lang),
    price: item.price,
    orders_from: item.orders_from,
    orders_to: item.orders_to,
    sort: item.sort,
  }));

  return SuccessResponse(res, { packages: formatted }, 200);
}

// 3. Get Package By ID
export async function getPackageById(req: Request, res: Response) {
  const { id } = req.params;
  const lang = req.query.lang as string | undefined;

  const row = await db.select().from(packages).where(eq(packages.id, id)).limit(1);
  if (!row[0]) throw new NotFound("Package not found");

  const formatted = {
    id: row[0].id,
    name: getLocalizedText(row[0].name, lang),
    names: parseJsonIfNeeded(row[0].name),
    price: row[0].price,
    orders_from: row[0].orders_from,
    orders_to: row[0].orders_to,
    sort: row[0].sort,
    createdAt: row[0].createdAt,
    updatedAt: row[0].updatedAt,
  };

  return SuccessResponse(res, { package: formatted }, 200);
}

// 4. Create Package
export async function createPackage(req: Request, res: Response) {
  const { name, price, orders_from, orders_to, sort } = req.body;

  await db.insert(packages).values({
    name: parseJsonIfNeeded(name),
    price: String(price),
    orders_from,
    orders_to: orders_to ?? null,
    sort,
  });

  return SuccessResponse(res, { message: "Package created successfully" }, 201);
}

// 5. Update Package
export async function updatePackage(req: Request, res: Response) {
  const { id } = req.params;
  const { name, price, orders_from, orders_to, sort } = req.body;

  const existing = await db.select().from(packages).where(eq(packages.id, id)).limit(1);
  if (!existing[0]) throw new NotFound("Package not found");

  const nextOrdersFrom = orders_from !== undefined ? orders_from : existing[0].orders_from;
  const nextOrdersTo = orders_to !== undefined ? orders_to : existing[0].orders_to;
  if (nextOrdersTo !== null && nextOrdersTo < nextOrdersFrom) {
    throw new BadRequest("orders_to must be greater than or equal to orders_from");
  }

  const updateData: Partial<typeof packages.$inferInsert> = {};
  if (name !== undefined) updateData.name = parseJsonIfNeeded(name);
  if (price !== undefined) updateData.price = String(price);
  if (orders_from !== undefined) updateData.orders_from = orders_from;
  if (orders_to !== undefined) updateData.orders_to = orders_to;
  if (sort !== undefined) updateData.sort = sort;

  if (Object.keys(updateData).length > 0) {
    await db.update(packages).set(updateData).where(eq(packages.id, id));
  }

  return SuccessResponse(res, { message: "Package updated successfully" }, 200);
}

// 6. Delete Package
export async function deletePackage(req: Request, res: Response) {
  const { id } = req.params;

  const existing = await db.select().from(packages).where(eq(packages.id, id)).limit(1);
  if (!existing[0]) throw new NotFound("Package not found");

  await db.delete(packages).where(eq(packages.id, id));

  return SuccessResponse(res, { message: "Package deleted successfully" }, 200);
}

// 7. Bulk Delete Packages
export async function bulkDeletePackages(req: Request, res: Response) {
  const { ids } = req.body as { ids: string[] };

  const existing = await db.select().from(packages).where(inArray(packages.id, ids));
  if (existing.length === 0) {
    return SuccessResponse(res, { message: "No matching packages found", deletedCount: 0 }, 200);
  }

  await db.delete(packages).where(inArray(packages.id, ids));

  return SuccessResponse(
    res,
    {
      message: `${existing.length} package(s) deleted successfully`,
      deletedCount: existing.length,
    },
    200
  );
}
