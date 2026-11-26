import { Request, Response } from "express";
import { db } from "../../models/db";
import { settings } from "../../models/schema";
import { eq } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";

// 1. Fetch First Settings Record
export async function getSettings(_req: Request, res: Response) {
  const rows = await db.select().from(settings).limit(1);

  return SuccessResponse(
    res,
    {
      settings: rows[0] || null,
    },
    200
  );
}

// 2. Create Settings If Empty or Update If Found (Upsert)
export async function upsertSettings(req: Request, res: Response) {
  const perimissionDays = Number(req.body.perimission_days);
  const existing = await db.select().from(settings).limit(1);

  if (existing[0]) {
    await db
      .update(settings)
      .set({ perimission_days: perimissionDays })
      .where(eq(settings.id, existing[0].id));

    const [updated] = await db
      .select()
      .from(settings)
      .where(eq(settings.id, existing[0].id))
      .limit(1);

    return SuccessResponse(
      res,
      {
        message: "Settings updated successfully",
        settings: updated,
      },
      200
    );
  }

  await db.insert(settings).values({
    perimission_days: perimissionDays,
  });

  const [created] = await db.select().from(settings).limit(1);

  return SuccessResponse(
    res,
    {
      message: "Settings created successfully",
      settings: created,
    },
    201
  );
}
