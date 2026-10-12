import { Request, Response } from "express";
import { db } from "../../models/db";
import { paymentMethods } from "../../models/schema";
import { eq } from "drizzle-orm";
import { NotFound } from "../../Errors";
import { SuccessResponse } from "../../utils/response";
import { uploadImage, updateImage, deleteImage } from "../../utils/handleImages";

const IMAGE_FOLDER = "payment_methods";

// 1. Get All Payment Methods
export async function getAllPaymentMethods(req: Request, res: Response) {
  const allPaymentMethods = await db.select().from(paymentMethods);
  return SuccessResponse(res, { paymentMethods: allPaymentMethods }, 200);
}

// 2. Get Payment Methods Selection (id, name)
export async function getPaymentMethodsSelection(req: Request, res: Response) {
  const list = await db
    .select({
      id: paymentMethods.id,
      name: paymentMethods.name,
    })
    .from(paymentMethods)
    .where(eq(paymentMethods.status, true));

  return SuccessResponse(res, { paymentMethods: list }, 200);
}

// 3. Get Payment Method By ID
export async function getPaymentMethodById(req: Request, res: Response) {
  const { id } = req.params;

  const paymentMethod = await db
    .select()
    .from(paymentMethods)
    .where(eq(paymentMethods.id, id))
    .limit(1);

  if (!paymentMethod[0]) {
    throw new NotFound("Payment method not found");
  }

  return SuccessResponse(res, { paymentMethod: paymentMethod[0] }, 200);
}

// 4. Create Payment Method
export async function createPaymentMethod(req: Request, res: Response) {
  const { name, icon, description, status } = req.body;

  const iconUrl = await uploadImage(req, icon, IMAGE_FOLDER);

  await db.insert(paymentMethods).values({
    name,
    icon: iconUrl,
    description: description ?? null,
    status: status ?? true,
  });

  return SuccessResponse(
    res,
    { message: "Payment method created successfully" },
    201
  );
}

// 5. Update Payment Method
export async function updatePaymentMethod(req: Request, res: Response) {
  const { id } = req.params;
  const { name, icon, description, status } = req.body;

  const existing = await db
    .select()
    .from(paymentMethods)
    .where(eq(paymentMethods.id, id))
    .limit(1);

  if (!existing[0]) {
    throw new NotFound("Payment method not found");
  }

  const updateData: Partial<typeof paymentMethods.$inferInsert> = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (status !== undefined) updateData.status = status;

  if (icon !== undefined && icon !== existing[0].icon) {
    updateData.icon = await updateImage(
      req,
      icon,
      IMAGE_FOLDER,
      existing[0].icon
    );
  }

  if (Object.keys(updateData).length > 0) {
    await db
      .update(paymentMethods)
      .set(updateData)
      .where(eq(paymentMethods.id, id));
  }

  return SuccessResponse(
    res,
    { message: "Payment method updated successfully" },
    200
  );
}

// 6. Delete Payment Method
export async function deletePaymentMethod(req: Request, res: Response) {
  const { id } = req.params;

  const existing = await db
    .select()
    .from(paymentMethods)
    .where(eq(paymentMethods.id, id))
    .limit(1);

  if (!existing[0]) {
    throw new NotFound("Payment method not found");
  }

  await deleteImage(existing[0].icon);
  await db.delete(paymentMethods).where(eq(paymentMethods.id, id));

  return SuccessResponse(
    res,
    { message: "Payment method deleted successfully" },
    200
  );
}
