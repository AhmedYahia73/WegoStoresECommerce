import { Request, Response, NextFunction } from "express";
import { db } from "../models/db";
import { admins } from "../models/schema";
import { eq } from "drizzle-orm";
import { ForbiddenError, UnauthorizedError } from "../Errors";

// ✅ Middleware للتحقق من تسجيل الدخول في جدول admins (Super Admin)
export const checkOnlyAdmin = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;

      if (!user) {
        throw new UnauthorizedError("Authentication required");
      }

      if (user.role !== "admin") {
        throw new ForbiddenError("You must login as Admin");
      }

      const existingAdmin = await db
        .select({ id: admins.id })
        .from(admins)
        .where(eq(admins.id, user.id))
        .limit(1);

      if (!existingAdmin[0]) {
        throw new ForbiddenError("You must login as Admin");
      }

      return next();
    } catch (error) {
      next(error);
    }
  };
};