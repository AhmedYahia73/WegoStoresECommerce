import { Request, Response } from "express";
import { db } from "../../models/db";
import { admins } from "../../models/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { generateAdminToken } from "../../utils/auth";
import { UnauthorizedError } from "../../Errors";
import { SuccessResponse } from "../../utils/response";
import { provisionTenantUser } from "../../services/tenantProvisionService";

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  const admin = await db
    .select()
    .from(admins)
    .where(eq(admins.email, email))
    .limit(1);

  if (!admin[0]) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const match = await bcrypt.compare(password, admin[0].password);
  if (!match) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const token = generateAdminToken({
    id: admin[0].id,
    name: admin[0].name,
    email: admin[0].email,
  });

  return SuccessResponse(
    res,
    {
      message: "Login successful",
      token,
      admin: {
        id: admin[0].id,
        name: admin[0].name,
        email: admin[0].email,
      },
    },
    200
  );
}

export async function hash_password(req: Request, res: Response) {
  const { password } = req.body;

  return SuccessResponse(
    res,
    {
      password: await bcrypt.hash(password, 10),
    },
    200
  );
}

/**
 * Public Tenant Signup:
 * - Creates a central `users` record with `api-<subdomain>` and starter package (`sort = 1`)
 * - Automatically sets `orders_from`, `orders_to`, `orders = 0`, `wallet = 0`, `start_date`, `end_date`
 * - Creates the tenant MySQL schema and seeds the owner account in `<schema>.admin`
 * - Returns a JWT token compatible with TenantECommerce `/api/sub_admin/*` endpoints
 */
export async function signup(req: Request, res: Response) {
  const { name, email, subdomain, phone, password } = req.body;

  const { subdomain: apiSubdomain, admin, user } = await provisionTenantUser(
    { name, email, subdomain, phone, password },
    { useDefaultStarterPackage: true }
  );

  const token = generateAdminToken({
    id: admin.id,
    name: admin.name,
    email: admin.email,
    phone: admin.phone,
  });

  return SuccessResponse(
    res,
    {
      message: "Tenant registered successfully",
      token,
      subdomain: apiSubdomain,
      admin,
      user,
    },
    201
  );
}