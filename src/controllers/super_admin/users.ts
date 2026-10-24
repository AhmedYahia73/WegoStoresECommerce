import { Request, Response } from "express";
import { db } from "../../models/db";
import { users, packages, orders } from "../../models/schema";
import { eq, and, ne, inArray, sql } from "drizzle-orm";
import bcrypt from "bcrypt";
import { ConflictError, NotFound } from "../../Errors";
import { SuccessResponse } from "../../utils/response";
import { getPaginationParams, buildPaginationMeta } from "../../utils/pagination";
import { getLocalizedText, parseJsonIfNeeded } from "../../utils/localization";
import { calculateSubscriptionEndDate } from "../../utils/subscription";
import {
  createTenantSchema,
  renameTenantSchema,
  deleteTenantSchema,
} from "../../services/tenantSchemaService";

// 1. Get All Users (Paginated, includes package info, subscription dates & orders count)
export async function getAllUsers(req: Request, res: Response) {
  const lang = req.query.lang as string | undefined;
  const { page, limit, offset } = getPaginationParams(req);

  const [countResult] = await db.select({ total: sql<number>`count(*)` }).from(users);
  const total = Number(countResult?.total || 0);

  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      subdomain: users.subdomain,
      phone: users.phone,
      package_id: users.package_id,
      package_name: packages.name,
      start_date: users.start_date,
      end_date: users.end_date,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .leftJoin(packages, eq(users.package_id, packages.id))
    .limit(limit)
    .offset(offset);

  // Fetch count of orders for each user from table `orders`
  const userIds = allUsers.map((u) => u.id);
  const orderCounts =
    userIds.length > 0
      ? await db
          .select({
            user_id: orders.user_id,
            count: sql<number>`count(*)`,
          })
          .from(orders)
          .where(inArray(orders.user_id, userIds))
          .groupBy(orders.user_id)
      : [];

  const countsMap = new Map<string, number>();
  for (const row of orderCounts) {
    countsMap.set(row.user_id, Number(row.count || 0));
  }

  const formattedUsers = allUsers.map((user) => ({
    ...user,
    package_name: user.package_name ? getLocalizedText(user.package_name, lang) : null,
    package_names: user.package_name ? parseJsonIfNeeded(user.package_name) : null,
    orders_count: countsMap.get(user.id) || 0,
  }));

  return SuccessResponse(
    res,
    {
      users: formattedUsers,
      pagination: buildPaginationMeta(total, page, limit),
    },
    200
  );
}

// 2. Get Users Relational Lists (e.g. packages for user add/edit)
export async function getUsersLists(req: Request, res: Response) {
  const lang = req.query.lang as string | undefined;

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

  return SuccessResponse(res, { packages: formattedPackages }, 200);
}

// 3. Get Users Selection (id, name, phone)
export async function getUsersSelection(req: Request, res: Response) {
  const list = await db
    .select({
      id: users.id,
      name: users.name,
      phone: users.phone,
    })
    .from(users);

  return SuccessResponse(res, { users: list }, 200);
}

// 4. Get User By ID
export async function getUserById(req: Request, res: Response) {
  const { id } = req.params;
  const lang = req.query.lang as string | undefined;

  const userRow = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      subdomain: users.subdomain,
      phone: users.phone,
      package_id: users.package_id,
      package_name: packages.name,
      start_date: users.start_date,
      end_date: users.end_date,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .leftJoin(packages, eq(users.package_id, packages.id))
    .where(eq(users.id, id))
    .limit(1);

  if (!userRow[0]) {
    throw new NotFound("User not found");
  }

  // Count orders for this user
  const [orderCountRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(eq(orders.user_id, id));

  const formatted = {
    ...userRow[0],
    package_name: userRow[0].package_name ? getLocalizedText(userRow[0].package_name, lang) : null,
    package_names: userRow[0].package_name ? parseJsonIfNeeded(userRow[0].package_name) : null,
    orders_count: Number(orderCountRow?.count || 0),
  };

  return SuccessResponse(res, { user: formatted }, 200);
}

// 5. Create User
export async function createUser(req: Request, res: Response) {
  const { name, email, subdomain, phone, password, package_id } = req.body;

  const existingEmail = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existingEmail[0]) {
    throw new ConflictError("Email already exists");
  }

  const existingSubdomain = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.subdomain, subdomain))
    .limit(1);
  if (existingSubdomain[0]) {
    throw new ConflictError("Subdomain already exists");
  }

  const existingPhone = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.phone, phone))
    .limit(1);
  if (existingPhone[0]) {
    throw new ConflictError("Phone already exists");
  }

  // Handle subscription if package_id is provided
  let calculatedStartDate: string | null = null;
  let calculatedEndDate: string | null = null;

  if (package_id) {
    const pkg = await db.select().from(packages).where(eq(packages.id, package_id)).limit(1);
    if (!pkg[0]) {
      throw new NotFound("Selected package not found");
    }
    const now = new Date();
    calculatedStartDate = now.toISOString().split("T")[0];
    calculatedEndDate = calculateSubscriptionEndDate(now, pkg[0].type);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // 1. Insert user into central users table
  await db.insert(users).values({
    name,
    email,
    subdomain,
    phone,
    password: hashedPassword,
    package_id: package_id ?? null,
    start_date: calculatedStartDate,
    end_date: calculatedEndDate,
  });

  // 2. Automatically create tenant wildcard MySQL schema with all 22 tables & initial data
  try {
    await createTenantSchema(subdomain);
  } catch (schemaError) {
    try {
      await db.delete(users).where(eq(users.subdomain, subdomain));
    } catch (cleanupUserErr) {
      console.error(`Rollback: Failed to delete user "${subdomain}":`, cleanupUserErr);
    }
    try {
      await deleteTenantSchema(subdomain);
    } catch (cleanupSchemaErr) {
      console.error(`Rollback: Failed to drop schema "${subdomain}":`, cleanupSchemaErr);
    }
    throw schemaError;
  }

  return SuccessResponse(res, { message: "User and tenant schema created successfully" }, 201);
}

// 6. Update User
export async function updateUser(req: Request, res: Response) {
  const { id } = req.params;
  const { name, email, subdomain, phone, password, package_id } = req.body;

  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!existingUser[0]) {
    throw new NotFound("User not found");
  }

  if (email && email !== existingUser[0].email) {
    const emailTaken = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, email), ne(users.id, id)))
      .limit(1);

    if (emailTaken[0]) {
      throw new ConflictError("Email already exists");
    }
  }

  const oldSubdomain = existingUser[0].subdomain;
  const isSubdomainChanged = subdomain && subdomain !== oldSubdomain;

  if (isSubdomainChanged) {
    const subdomainTaken = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.subdomain, subdomain), ne(users.id, id)))
      .limit(1);

    if (subdomainTaken[0]) {
      throw new ConflictError("Subdomain already exists");
    }
  }

  if (phone && phone !== existingUser[0].phone) {
    const phoneTaken = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.phone, phone), ne(users.id, id)))
      .limit(1);

    if (phoneTaken[0]) {
      throw new ConflictError("Phone already exists");
    }
  }

  const updateData: Partial<typeof users.$inferInsert> = {};
  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email;
  if (subdomain !== undefined) updateData.subdomain = subdomain;
  if (phone !== undefined) updateData.phone = phone;
  if (password !== undefined) {
    updateData.password = await bcrypt.hash(password, 10);
  }

  // Handle package change
  if (package_id !== undefined) {
    if (package_id === null || package_id === "") {
      updateData.package_id = null;
      updateData.start_date = null;
      updateData.end_date = null;
    } else {
      const pkg = await db.select().from(packages).where(eq(packages.id, package_id)).limit(1);
      if (!pkg[0]) {
        throw new NotFound("Selected package not found");
      }
      const now = new Date();
      updateData.package_id = pkg[0].id;
      updateData.start_date = now.toISOString().split("T")[0];
      updateData.end_date = calculateSubscriptionEndDate(now, pkg[0].type);
    }
  }

  // If subdomain changed, rename the MySQL database / schema
  if (isSubdomainChanged) {
    await renameTenantSchema(oldSubdomain, subdomain);
  }

  if (Object.keys(updateData).length > 0) {
    await db.update(users).set(updateData).where(eq(users.id, id));
  }

  return SuccessResponse(res, { message: "User updated successfully" }, 200);
}

// 7. Delete User
export async function deleteUser(req: Request, res: Response) {
  const { id } = req.params;

  const existingUser = await db
    .select({ id: users.id, subdomain: users.subdomain })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!existingUser[0]) {
    throw new NotFound("User not found");
  }

  // 1. Drop tenant wildcard database/schema
  await deleteTenantSchema(existingUser[0].subdomain);

  // 2. Delete user from central database
  await db.delete(users).where(eq(users.id, id));

  return SuccessResponse(res, { message: "User and tenant schema deleted successfully" }, 200);
}
