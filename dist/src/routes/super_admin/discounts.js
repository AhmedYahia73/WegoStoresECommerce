"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const discounts_1 = require("../../controllers/super_admin/discounts");
const catchAsync_1 = require("../../utils/catchAsync");
const validation_1 = require("../../middlewares/validation");
const checkpermission_1 = require("../../middlewares/checkpermission");
const discounts_2 = require("../../validators/super_admin/discounts");
const common_1 = require("../../validators/super_admin/common");
const router = (0, express_1.Router)();
// Bulk delete operations (MUST precede /:id)
router.post("/bulk-delete", (0, checkpermission_1.checkOnlyAdmin)(), (0, validation_1.validate)(common_1.bulkDeleteSchema), (0, catchAsync_1.catchAsync)(discounts_1.bulkDeleteDiscounts));
router.delete("/bulk", (0, checkpermission_1.checkOnlyAdmin)(), (0, validation_1.validate)(common_1.bulkDeleteSchema), (0, catchAsync_1.catchAsync)(discounts_1.bulkDeleteDiscounts));
// Query operations
router.get("/", (0, checkpermission_1.checkOnlyAdmin)(), (0, catchAsync_1.catchAsync)(discounts_1.getAllDiscounts));
router.get("/select", (0, checkpermission_1.checkOnlyAdmin)(), (0, catchAsync_1.catchAsync)(discounts_1.getDiscountsSelection));
// CRUD operations
router.get("/:id", (0, checkpermission_1.checkOnlyAdmin)(), (0, validation_1.validate)(discounts_2.discountIdParamSchema), (0, catchAsync_1.catchAsync)(discounts_1.getDiscountById));
router.post("/", (0, checkpermission_1.checkOnlyAdmin)(), (0, validation_1.validate)(discounts_2.createDiscountSchema), (0, catchAsync_1.catchAsync)(discounts_1.createDiscount));
router.put("/:id", (0, checkpermission_1.checkOnlyAdmin)(), (0, validation_1.validate)(discounts_2.updateDiscountSchema), (0, catchAsync_1.catchAsync)(discounts_1.updateDiscount));
router.delete("/:id", (0, checkpermission_1.checkOnlyAdmin)(), (0, validation_1.validate)(discounts_2.discountIdParamSchema), (0, catchAsync_1.catchAsync)(discounts_1.deleteDiscount));
exports.default = router;
