import { Request, Response } from "express";
import { db } from "../../models/db";
import { admins } from "../../models/schema";
import { eq, and, ne } from "drizzle-orm";
import bcrypt from "bcrypt";
import { ConflictError, NotFound } from "../../Errors";
import { SuccessResponse } from "../../utils/response";

// 1. Get All Admins
export async function getAllAdmin(req: Request, res: Response) {
  const allAdmins = await db
    .select({
      id: admins.id,
      name: admins.name,
      email: admins.email,
      createdAt: admins.createdAt,
      updatedAt: admins.updatedAt,
    })
    .from(admins);

  return SuccessResponse(res, { admins: allAdmins }, 200);
}

// 2. Get Admin By ID
export async function getAdminById(req: Request, res: Response) {
  const { id } = req.params;

  const admin = await db
    .select({
      id: admins.id,
      name: admins.name,
      email: admins.email,
      createdAt: admins.createdAt,
      updatedAt: admins.updatedAt,
    })
    .from(admins)
    .where(eq(admins.id, id))
    .limit(1);

  if (!admin[0]) {
    throw new NotFound("Admin not found");
  }

  return SuccessResponse(res, { admin: admin[0] }, 200);
}

// 3. Create Admin
export async function createAdmin(req: Request, res: Response) {
  const { name, email, password } = req.body;

  const existingAdmin = await db
    .select({ id: admins.id })
    .from(admins)
    .where(eq(admins.email, email))
    .limit(1);

  if (existingAdmin[0]) {
    throw new ConflictError("Email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await db.insert(admins).values({
    name,
    email,
    password: hashedPassword,
  });

  return SuccessResponse(res, { message: "Admin created successfully" }, 201);
}

// 4. Update Admin
export async function updateAdmin(req: Request, res: Response) {
  const { id } = req.params;
  const { name, email, password } = req.body;

  const existingAdmin = await db
    .select()
    .from(admins)
    .where(eq(admins.id, id))
    .limit(1);

  if (!existingAdmin[0]) {
    throw new NotFound("Admin not found");
  }

  if (email && email !== existingAdmin[0].email) {
    const emailTaken = await db
      .select({ id: admins.id })
      .from(admins)
      .where(and(eq(admins.email, email), ne(admins.id, id)))
      .limit(1);

    if (emailTaken[0]) {
      throw new ConflictError("Email already exists");
    }
  }

  const updateData: Partial<typeof admins.$inferInsert> = {};
  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email;
  if (password !== undefined) {
    updateData.password = await bcrypt.hash(password, 10);
  }

  if (Object.keys(updateData).length > 0) {
    await db.update(admins).set(updateData).where(eq(admins.id, id));
  }

  return SuccessResponse(res, { message: "Admin updated successfully" }, 200);
}

// 5. Delete Admin
export async function deleteAdmin(req: Request, res: Response) {
  const { id } = req.params;

  const existingAdmin = await db
    .select({ id: admins.id })
    .from(admins)
    .where(eq(admins.id, id))
    .limit(1);

  if (!existingAdmin[0]) {
    throw new NotFound("Admin not found");
  }

  await db.delete(admins).where(eq(admins.id, id));

  return SuccessResponse(res, { message: "Admin deleted successfully" }, 200);
}
