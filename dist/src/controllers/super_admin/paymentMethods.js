"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllPaymentMethods = getAllPaymentMethods;
exports.getPaymentMethodsSelection = getPaymentMethodsSelection;
exports.getPaymentMethodById = getPaymentMethodById;
exports.createPaymentMethod = createPaymentMethod;
exports.updatePaymentMethod = updatePaymentMethod;
exports.deletePaymentMethod = deletePaymentMethod;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const Errors_1 = require("../../Errors");
const response_1 = require("../../utils/response");
const handleImages_1 = require("../../utils/handleImages");
const IMAGE_FOLDER = "payment_methods";
// 1. Get All Payment Methods
async function getAllPaymentMethods(req, res) {
    const allPaymentMethods = await db_1.db.select().from(schema_1.paymentMethods);
    return (0, response_1.SuccessResponse)(res, { paymentMethods: allPaymentMethods }, 200);
}
// 2. Get Payment Methods Selection (id, name)
async function getPaymentMethodsSelection(req, res) {
    const list = await db_1.db
        .select({
        id: schema_1.paymentMethods.id,
        name: schema_1.paymentMethods.name,
    })
        .from(schema_1.paymentMethods)
        .where((0, drizzle_orm_1.eq)(schema_1.paymentMethods.status, true));
    return (0, response_1.SuccessResponse)(res, { paymentMethods: list }, 200);
}
// 3. Get Payment Method By ID
async function getPaymentMethodById(req, res) {
    const { id } = req.params;
    const paymentMethod = await db_1.db
        .select()
        .from(schema_1.paymentMethods)
        .where((0, drizzle_orm_1.eq)(schema_1.paymentMethods.id, id))
        .limit(1);
    if (!paymentMethod[0]) {
        throw new Errors_1.NotFound("Payment method not found");
    }
    return (0, response_1.SuccessResponse)(res, { paymentMethod: paymentMethod[0] }, 200);
}
// 4. Create Payment Method
async function createPaymentMethod(req, res) {
    const { name, icon, description, status } = req.body;
    const iconUrl = await (0, handleImages_1.uploadImage)(req, icon, IMAGE_FOLDER);
    await db_1.db.insert(schema_1.paymentMethods).values({
        name,
        icon: iconUrl,
        description: description ?? null,
        status: status ?? true,
    });
    return (0, response_1.SuccessResponse)(res, { message: "Payment method created successfully" }, 201);
}
// 5. Update Payment Method
async function updatePaymentMethod(req, res) {
    const { id } = req.params;
    const { name, icon, description, status } = req.body;
    const existing = await db_1.db
        .select()
        .from(schema_1.paymentMethods)
        .where((0, drizzle_orm_1.eq)(schema_1.paymentMethods.id, id))
        .limit(1);
    if (!existing[0]) {
        throw new Errors_1.NotFound("Payment method not found");
    }
    const updateData = {};
    if (name !== undefined)
        updateData.name = name;
    if (description !== undefined)
        updateData.description = description;
    if (status !== undefined)
        updateData.status = status;
    if (icon !== undefined && icon !== existing[0].icon) {
        updateData.icon = await (0, handleImages_1.updateImage)(req, icon, IMAGE_FOLDER, existing[0].icon);
    }
    if (Object.keys(updateData).length > 0) {
        await db_1.db
            .update(schema_1.paymentMethods)
            .set(updateData)
            .where((0, drizzle_orm_1.eq)(schema_1.paymentMethods.id, id));
    }
    return (0, response_1.SuccessResponse)(res, { message: "Payment method updated successfully" }, 200);
}
// 6. Delete Payment Method
async function deletePaymentMethod(req, res) {
    const { id } = req.params;
    const existing = await db_1.db
        .select()
        .from(schema_1.paymentMethods)
        .where((0, drizzle_orm_1.eq)(schema_1.paymentMethods.id, id))
        .limit(1);
    if (!existing[0]) {
        throw new Errors_1.NotFound("Payment method not found");
    }
    await (0, handleImages_1.deleteImage)(existing[0].icon);
    await db_1.db.delete(schema_1.paymentMethods).where((0, drizzle_orm_1.eq)(schema_1.paymentMethods.id, id));
    return (0, response_1.SuccessResponse)(res, { message: "Payment method deleted successfully" }, 200);
}
