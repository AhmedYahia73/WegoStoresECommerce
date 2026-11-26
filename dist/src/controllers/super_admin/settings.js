"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSettings = getSettings;
exports.upsertSettings = upsertSettings;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../utils/response");
// 1. Fetch First Settings Record
async function getSettings(_req, res) {
    const rows = await db_1.db.select().from(schema_1.settings).limit(1);
    return (0, response_1.SuccessResponse)(res, {
        settings: rows[0] || null,
    }, 200);
}
// 2. Create Settings If Empty or Update If Found (Upsert)
async function upsertSettings(req, res) {
    const perimissionDays = Number(req.body.perimission_days);
    const existing = await db_1.db.select().from(schema_1.settings).limit(1);
    if (existing[0]) {
        await db_1.db
            .update(schema_1.settings)
            .set({ perimission_days: perimissionDays })
            .where((0, drizzle_orm_1.eq)(schema_1.settings.id, existing[0].id));
        const [updated] = await db_1.db
            .select()
            .from(schema_1.settings)
            .where((0, drizzle_orm_1.eq)(schema_1.settings.id, existing[0].id))
            .limit(1);
        return (0, response_1.SuccessResponse)(res, {
            message: "Settings updated successfully",
            settings: updated,
        }, 200);
    }
    await db_1.db.insert(schema_1.settings).values({
        perimission_days: perimissionDays,
    });
    const [created] = await db_1.db.select().from(schema_1.settings).limit(1);
    return (0, response_1.SuccessResponse)(res, {
        message: "Settings created successfully",
        settings: created,
    }, 201);
}
