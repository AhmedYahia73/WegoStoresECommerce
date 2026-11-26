"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const walletOrders_1 = require("../../controllers/super_admin/walletOrders");
const catchAsync_1 = require("../../utils/catchAsync");
const validation_1 = require("../../middlewares/validation");
const checkpermission_1 = require("../../middlewares/checkpermission");
const walletOrders_2 = require("../../validators/super_admin/walletOrders");
const common_1 = require("../../validators/super_admin/common");
const upload_1 = require("../../middlewares/upload");
const router = (0, express_1.Router)();
// Bulk delete operation (MUST precede /:id)
router.delete("/bulk", (0, checkpermission_1.checkOnlyAdmin)(), (0, validation_1.validate)(common_1.bulkDeleteSchema), (0, catchAsync_1.catchAsync)(walletOrders_1.bulkDeleteWalletOrders));
// Query operations
router.get("/", (0, checkpermission_1.checkOnlyAdmin)(), (0, catchAsync_1.catchAsync)(walletOrders_1.getAllWalletOrders));
router.get("/lists", (0, checkpermission_1.checkOnlyAdmin)(), (0, catchAsync_1.catchAsync)(walletOrders_1.getWalletOrdersLists));
// Status change (Approve or Reject with reject_reason)
router.patch("/:id/status", (0, checkpermission_1.checkOnlyAdmin)(), (0, validation_1.validate)(walletOrders_2.changeWalletOrderStatusSchema), (0, catchAsync_1.catchAsync)(walletOrders_1.changeWalletOrderStatus));
// CRUD operations
router.get("/:id", (0, checkpermission_1.checkOnlyAdmin)(), (0, validation_1.validate)(walletOrders_2.walletOrderIdParamSchema), (0, catchAsync_1.catchAsync)(walletOrders_1.getWalletOrderById));
router.post("/", (0, checkpermission_1.checkOnlyAdmin)(), (0, upload_1.uploadSingleFile)("receipt"), (0, validation_1.validate)(walletOrders_2.createWalletOrderSchema), (0, catchAsync_1.catchAsync)(walletOrders_1.createWalletOrder));
router.delete("/:id", (0, checkpermission_1.checkOnlyAdmin)(), (0, validation_1.validate)(walletOrders_2.walletOrderIdParamSchema), (0, catchAsync_1.catchAsync)(walletOrders_1.deleteWalletOrder));
exports.default = router;
