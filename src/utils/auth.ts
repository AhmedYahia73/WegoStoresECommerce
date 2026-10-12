import jwt from "jsonwebtoken";
import { UnauthorizedError } from "../Errors";
import { TokenPayload } from "../types/custom";
import "dotenv/config";

const JWT_SECRET = process.env.JWT_SECRET as string;

// ✅ للـ Super Admin (من جدول admins)
export const generateAdminToken = (data: {
  id: string;
  name: string;
  email: string;
  phone?: string;
}): string => {
  const payload: TokenPayload = {
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    role: "admin",
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};

// ✅ للـ User / Tenant (من جدول users)
export const generateUserToken = (data: {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "admin" | "leader" | "sales" | "user";
}): string => {
  const payload: TokenPayload = {
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    role: data.role as any,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};

// 🛡️ التحقق من صحة الـ Token وفك تشفيره
export const verifyToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    throw new UnauthorizedError("Invalid token");
  }
};