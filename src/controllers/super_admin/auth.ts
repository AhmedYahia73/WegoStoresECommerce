import { Request, Response } from "express";
import { db } from "../../models/db";
import { admins } from "../../models/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { generateAdminToken } from "../../utils/auth";
import { UnauthorizedError } from "../../Errors";
import { SuccessResponse } from "../../utils/response";

export async function loginAdmin(req: Request, res: Response) {
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
