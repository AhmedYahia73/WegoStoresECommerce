"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaymob = getPaymob;
exports.createOrUpdatePaymob = createOrUpdatePaymob;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const Errors_1 = require("../../Errors");
const response_1 = require("../../utils/response");
const localization_1 = require("../../utils/localization");
const handleImages_1 = require("../../utils/handleImages");
const IMAGE_FOLDER = "paymob";
const DEFAULT_CALLBACK_TEMPLATE = "{subdomain}/api/paymob_callback";
function resolveCallbackUrl(req, rawCallbackUrl) {
    const host = req.get("host");
    const baseOrigin = host ? `${req.protocol}://${host}` : "";
    const template = rawCallbackUrl || DEFAULT_CALLBACK_TEMPLATE;
    if (baseOrigin && template.includes("{subdomain}")) {
        return template.replace("{subdomain}", baseOrigin);
    }
    return template;
}
function formatPaymobRecord(req, item, lang) {
    return {
        id: item.id,
        name: (0, localization_1.getLocalizedText)(item.name, lang),
        names: (0, localization_1.parseJsonIfNeeded)(item.name),
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
async function getPaymob(req, res) {
    const lang = req.query.lang;
    const rows = await db_1.db.select().from(schema_1.paymob).limit(1);
    if (!rows[0]) {
        return (0, response_1.SuccessResponse)(res, {
            paymob: null,
            callback_url: resolveCallbackUrl(req, DEFAULT_CALLBACK_TEMPLATE),
        }, 200);
    }
    return (0, response_1.SuccessResponse)(res, {
        paymob: formatPaymobRecord(req, rows[0], lang),
    }, 200);
}
// 2. Create or Update Paymob Settings (Upsert: update if exists, create if empty)
async function createOrUpdatePaymob(req, res) {
    const lang = req.query.lang;
    const { name, logo, api_key, iframe_id, integration_id, hmac, type, status, callback_url, } = req.body;
    const existing = await db_1.db.select().from(schema_1.paymob).limit(1);
    if (existing[0]) {
        const updateData = {
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
            updateData.logo = await (0, handleImages_1.updateImage)(req, logo, IMAGE_FOLDER, existing[0].logo);
        }
        await db_1.db.update(schema_1.paymob).set(updateData).where((0, drizzle_orm_1.eq)(schema_1.paymob.id, existing[0].id));
        const [updated] = await db_1.db.select().from(schema_1.paymob).where((0, drizzle_orm_1.eq)(schema_1.paymob.id, existing[0].id)).limit(1);
        return (0, response_1.SuccessResponse)(res, {
            message: "Paymob settings updated successfully",
            paymob: formatPaymobRecord(req, updated, lang),
        }, 200);
    }
    if (!logo) {
        throw new Errors_1.BadRequest("Logo image is required");
    }
    const logoUrl = await (0, handleImages_1.uploadImage)(req, logo, IMAGE_FOLDER);
    const storedCallbackUrl = callback_url || DEFAULT_CALLBACK_TEMPLATE;
    await db_1.db.insert(schema_1.paymob).values({
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
    const [created] = await db_1.db.select().from(schema_1.paymob).limit(1);
    return (0, response_1.SuccessResponse)(res, {
        message: "Paymob settings created successfully",
        paymob: formatPaymobRecord(req, created, lang),
    }, 201);
}
