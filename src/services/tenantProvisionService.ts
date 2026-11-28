import crypto from "crypto";
import bcrypt from "bcrypt";
import { eq, inArray } from "drizzle-orm";
import { db } from "../models/db";
import { packages, users } from "../models/schema";
import { ConflictError, NotFound } from "../Errors";
import { calculateSubscriptionEndDate } from "../utils/subscription";
import { formatApiSubdomain, stripApiPrefix } from "../utils/subdomain";
import {
  createTenantSchema,
  deleteTenantSchema,
  seedTenantOwnerAdmin,
  CreatedTenantAdmin,
} from "./tenantSchemaService";

export interface ProvisionTenantInput {
  name: string;
  email: string;
  subdomain: string;
  phone: string;
  password: string;
  package_id?: string | null;
  wallet?: string | number;
}

export interface ProvisionTenantOptions {
  /** When true (public signup), auto-assigns package with sort = 1, orders = 0, wallet = 0. */
  useDefaultStarterPackage?: boolean;
}

export interface ProvisionTenantResult {
  subdomain: string;
  admin: CreatedTenantAdmin;
  user: {
    id: string;
    name: string;
    email: string;
    subdomain: string;
    phone: string;
    package_id: string | null;
    orders_from: number;
    orders_to: number | null;
    orders: number;
    wallet: string;
    start_date: string | null;
    end_date: string | null;
  };
}

/**
 * Creates a tenant user in the central `users` table, creates their `api-<name>` MySQL schema,
 * and seeds the owner account in `<schema>.admin` with atomic rollback on failure.
 */
export async function provisionTenantUser(
  input: ProvisionTenantInput,
  options: ProvisionTenantOptions = {}
): Promise<ProvisionTenantResult> {
  const { name, email, subdomain, phone, password, package_id, wallet } = input;
  const apiSubdomain = formatApiSubdomain(subdomain);
  const baseSubdomain = stripApiPrefix(apiSubdomain);

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
    .where(inArray(users.subdomain, [apiSubdomain, baseSubdomain]))
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

  let resolvedPackageId: string | null = null;
  let calculatedStartDate: string | null = null;
  let calculatedEndDate: string | null = null;
  let calculatedOrdersFrom = 0;
  let calculatedOrdersTo: number | null = 0;

  if (options.useDefaultStarterPackage) {
    const [starterPkg] = await db
      .select()
      .from(packages)
      .where(eq(packages.sort, 1))
      .limit(1);

    if (!starterPkg) {
      throw new NotFound("Default starter package (sort = 1) not found");
    }

    const now = new Date();
    resolvedPackageId = starterPkg.id;
    calculatedStartDate = now.toISOString().split("T")[0];
    calculatedEndDate = calculateSubscriptionEndDate(now);
    calculatedOrdersFrom = starterPkg.orders_from;
    calculatedOrdersTo = starterPkg.orders_to;
  } else if (package_id) {
    const [pkg] = await db
      .select()
      .from(packages)
      .where(eq(packages.id, package_id))
      .limit(1);

    if (!pkg) {
      throw new NotFound("Selected package not found");
    }

    const now = new Date();
    resolvedPackageId = pkg.id;
    calculatedStartDate = now.toISOString().split("T")[0];
    calculatedEndDate = calculateSubscriptionEndDate(now);
    calculatedOrdersFrom = pkg.orders_from;
    calculatedOrdersTo = pkg.orders_to;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = crypto.randomUUID();
  const resolvedWallet = options.useDefaultStarterPackage
    ? "0.00"
    : String(wallet ?? 0);

  await db.insert(users).values({
    id: userId,
    name,
    email,
    subdomain: apiSubdomain,
    phone,
    password: hashedPassword,
    package_id: resolvedPackageId,
    orders_from: calculatedOrdersFrom,
    orders_to: calculatedOrdersTo,
    orders: 0,
    wallet: resolvedWallet,
    start_date: calculatedStartDate,
    end_date: calculatedEndDate,
  });

  try {
    await createTenantSchema(apiSubdomain);
    const createdAdmin = await seedTenantOwnerAdmin(apiSubdomain, {
      name,
      email,
      phone,
      hashedPassword,
    });

    return {
      subdomain: apiSubdomain,
      admin: createdAdmin,
      user: {
        id: userId,
        name,
        email,
        subdomain: apiSubdomain,
        phone,
        package_id: resolvedPackageId,
        orders_from: calculatedOrdersFrom,
        orders_to: calculatedOrdersTo,
        orders: 0,
        wallet: resolvedWallet,
        start_date: calculatedStartDate,
        end_date: calculatedEndDate,
      },
    };
  } catch (schemaError) {
    try {
      await db.delete(users).where(eq(users.id, userId));
    } catch (cleanupUserErr) {
      console.error(`Rollback: Failed to delete user "${apiSubdomain}":`, cleanupUserErr);
    }
    try {
      await deleteTenantSchema(apiSubdomain);
    } catch (cleanupSchemaErr) {
      console.error(`Rollback: Failed to drop schema "${apiSubdomain}":`, cleanupSchemaErr);
    }
    throw schemaError;
  }
}
