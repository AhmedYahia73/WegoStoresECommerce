import { Request, Response } from "express";
import { db } from "../../models/db";
import { paymob } from "../../models/schema";
import { eq } from "drizzle-orm";
import { BadRequest } from "../../Errors";
import { SuccessResponse } from "../../utils/response";
import { getLocalizedText, parseJsonIfNeeded } from "../../utils/localization";
import { uploadImage, updateImage } from "../../utils/handleImages";

const IMAGE_FOLDER = "paymob";
const DEFAULT_CALLBACK_TEMPLATE = "{subdomain}/api/paymob_callback";

function resolveCallbackUrl(req: Request, rawCallbackUrl?: string | null): string {
  const host = req.get("host");
  const baseOrigin = host ? `${req.protocol}://${host}` : "";
  const template = rawCallbackUrl || DEFAULT_CALLBACK_TEMPLATE;

  if (baseOrigin && template.includes("{subdomain}")) {
    return template.replace("{subdomain}", baseOrigin);
  }
  return template;
}

function formatPaymobRecord(
  req: Request,
  item: typeof paymob.$inferSelect,
  lang?: string
) {
  return {
    id: item.id,
    name: getLocalizedText(item.name, lang),
    names: parseJsonIfNeeded(item.name),
    logo: item.logo,
    api_key: item.api_key,
    iframe_id: item.iframe_id,
    integration_id: item.integration_id,
    hmac: item.hmac,
    type: item.type,
    status: item.status,
    callback_url: resolveCallbackUrl(req, item.callback_url),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

// 1. Fetch Paymob Settings (Single Record)
export async function getPaymob(req: Request, res: Response) {
  const lang = req.query.lang as string | undefined;
  const rows = await db.select().from(paymob).limit(1);

  if (!rows[0]) {
    return SuccessResponse(
      res,
      {
        paymob: null,
        callback_url: resolveCallbackUrl(req, DEFAULT_CALLBACK_TEMPLATE),
      },
      200
    );
  }

  return SuccessResponse(
    res,
    {
      paymob: formatPaymobRecord(req, rows[0], lang),
    },
    200
  );
}

// 2. Create or Update Paymob Settings (Upsert: update if exists, create if empty)
export async function createOrUpdatePaymob(req: Request, res: Response) {
  const lang = req.query.lang as string | undefined;
  const {
    name,
    logo,
    api_key,
    iframe_id,
    integration_id,
    hmac,
    type,
    status,
    callback_url,
  } = req.body;

  const existing = await db.select().from(paymob).limit(1);

  if (existing[0]) {
    const updateData: Partial<typeof paymob.$inferInsert> = {
      name,
      api_key,
      iframe_id: String(iframe_id),
      integration_id: String(integration_id),
      hmac,
      type: type || "test",
      status: status !== undefined ? Boolean(status) : true,
    };

    if (callback_url !== undefined) {
      updateData.callback_url = callback_url;
    }

    if (logo) {
      updateData.logo = await updateImage(req, logo, IMAGE_FOLDER, existing[0].logo);
    }

    await db.update(paymob).set(updateData).where(eq(paymob.id, existing[0].id));

    const [updated] = await db.select().from(paymob).where(eq(paymob.id, existing[0].id)).limit(1);

    return SuccessResponse(
      res,
      {
        message: "Paymob settings updated successfully",
        paymob: formatPaymobRecord(req, updated, lang),
      },
      200
    );
  }

  if (!logo) {
    throw new BadRequest("Logo image is required");
  }

  const logoUrl = await uploadImage(req, logo, IMAGE_FOLDER);
  const storedCallbackUrl = callback_url || DEFAULT_CALLBACK_TEMPLATE;

  await db.insert(paymob).values({
    name,
    logo: logoUrl,
    api_key,
    iframe_id: String(iframe_id),
    integration_id: String(integration_id),
    hmac,
    type: type || "test",
    status: status !== undefined ? Boolean(status) : true,
    callback_url: storedCallbackUrl,
  });

  const [created] = await db.select().from(paymob).limit(1);

  return SuccessResponse(
    res,
    {
      message: "Paymob settings created successfully",
      paymob: formatPaymobRecord(req, created, lang),
    },
    201
  );
}
