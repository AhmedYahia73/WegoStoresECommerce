"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userOrders_1 = require("../../controllers/super_admin/userOrders");
const catchAsync_1 = require("../../utils/catchAsync");
const validation_1 = require("../../middlewares/validation");
const checkpermission_1 = require("../../middlewares/checkpermission");
const userOrders_2 = require("../../validators/super_admin/userOrders");
const common_1 = require("../../validators/super_admin/common");
const router = (0, express_1.Router)();
// Bulk delete operations (MUST precede /:id)
router.post("/bulk-delete", (0, checkpermission_1.checkOnlyAdmin)(), (0, validation_1.validate)(common_1.bulkDeleteSchema), (0, catchAsync_1.catchAsync)(userOrders_1.bulkDeleteUserOrders));
router.delete("/bulk", (0, checkpermission_1.checkOnlyAdmin)(), (0, validation_1.validate)(common_1.bulkDeleteSchema), (0, catchAsync_1.catchAsync)(userOrders_1.bulkDeleteUserOrders));
// Query operations
router.get("/", (0, checkpermission_1.checkOnlyAdmin)(), (0, catchAsync_1.catchAsync)(userOrders_1.getAllUserOrders));
router.get("/lists", (0, checkpermission_1.checkOnlyAdmin)(), (0, catchAsync_1.catchAsync)(userOrders_1.getUserOrdersLists));
// Status change (Approve or Reject with reject_reason)
router.patch("/:id/status", (0, checkpermission_1.checkOnlyAdmin)(), (0, validation_1.validate)(userOrders_2.changeUserOrderStatusSchema), (0, catchAsync_1.catchAsync)(userOrders_1.changeUserOrderStatus));
router.put("/:id/status", (0, checkpermission_1.checkOnlyAdmin)(), (0, validation_1.validate)(userOrders_2.changeUserOrderStatusSchema), (0, catchAsync_1.catchAsync)(userOrders_1.changeUserOrderStatus));
// CRUD operations
router.get("/:id", (0, checkpermission_1.checkOnlyAdmin)(), (0, validation_1.validate)(userOrders_2.userOrderIdParamSchema), (0, catchAsync_1.catchAsync)(userOrders_1.getUserOrderById));
router.post("/", (0, checkpermission_1.checkOnlyAdmin)(), (0, validation_1.validate)(userOrders_2.createUserOrderSchema), (0, catchAsync_1.catchAsync)(userOrders_1.createUserOrder));
router.delete("/:id", (0, checkpermission_1.checkOnlyAdmin)(), (0, validation_1.validate)(userOrders_2.userOrderIdParamSchema), (0, catchAsync_1.catchAsync)(userOrders_1.deleteUserOrder));
exports.default = router;
