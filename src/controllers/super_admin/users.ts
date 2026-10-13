import { Request, Response } from "express";
import { db } from "../../models/db";
import { users } from "../../models/schema";
import { eq, and, ne, sql } from "drizzle-orm";
import bcrypt from "bcrypt";
import { ConflictError, NotFound } from "../../Errors";
import { SuccessResponse } from "../../utils/response";
import { getPaginationParams, buildPaginationMeta } from "../../utils/pagination";
import {
  createTenantSchema,
  renameTenantSchema,
  deleteTenantSchema,
} from "../../services/tenantSchemaService";

// 1. Get All Users (Paginated)
export async function getAllUsers(req: Request, res: Response) {
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
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .limit(limit)
    .offset(offset);

  return SuccessResponse(
    res,
    {
      users: allUsers,
      pagination: buildPaginationMeta(total, page, limit),
    },
    200
  );
}

// 2. Get Users Selection (id, name) for relational dropdowns (e.g. orders.user_id)
export async function getUsersSelection(req: Request, res: Response) {
  const list = await db
    .select({
      id: users.id,
      name: users.name,
    })
    .from(users);

  return SuccessResponse(res, { users: list }, 200);
}

// 3. Get User By ID
export async function getUserById(req: Request, res: Response) {
  const { id } = req.params;

  const user = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      subdomain: users.subdomain,
      phone: users.phone,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!user[0]) {
    throw new NotFound("User not found");
  }

  return SuccessResponse(res, { user: user[0] }, 200);
}

// 4. Create User
export async function createUser(req: Request, res: Response) {
  const { name, email, subdomain, phone, password } = req.body;

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

  const hashedPassword = await bcrypt.hash(password, 10);

  // 1. Insert user into central users table
  await db.insert(users).values({
    name,
    email,
    subdomain,
    phone,
    password: hashedPassword,
  });

  // 2. Automatically create tenant wildcard MySQL schema with all 21 tables & initial data
  try {
    await createTenantSchema(subdomain);
  } catch (schemaError) {
    // If schema creation fails, rollback user record from central DB
    await db.delete(users).where(eq(users.subdomain, subdomain));
    throw schemaError;
  }

  return SuccessResponse(res, { message: "User and tenant schema created successfully" }, 201);
}

// 5. Update User
export async function updateUser(req: Request, res: Response) {
  const { id } = req.params;
  const { name, email, subdomain, phone, password } = req.body;

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

  // If subdomain changed, rename the MySQL database / schema
  if (isSubdomainChanged) {
    await renameTenantSchema(oldSubdomain, subdomain);
  }

  if (Object.keys(updateData).length > 0) {
    await db.update(users).set(updateData).where(eq(users.id, id));
  }

  return SuccessResponse(res, { message: "User updated successfully" }, 200);
}

// 6. Delete User
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
