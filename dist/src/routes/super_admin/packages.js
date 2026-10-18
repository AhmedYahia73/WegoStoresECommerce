"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const packages_1 = require("../../controllers/super_admin/packages");
const catchAsync_1 = require("../../utils/catchAsync");
const validation_1 = require("../../middlewares/validation");
const checkpermission_1 = require("../../middlewares/checkpermission");
const packages_2 = require("../../validators/super_admin/packages");
const common_1 = require("../../validators/super_admin/common");
const router = (0, express_1.Router)();
// Bulk delete operations (MUST precede /:id)
router.post("/bulk-delete", (0, checkpermission_1.checkOnlyAdmin)(), (0, validation_1.validate)(common_1.bulkDeleteSchema), (0, catchAsync_1.catchAsync)(packages_1.bulkDeletePackages));
router.delete("/bulk", (0, checkpermission_1.checkOnlyAdmin)(), (0, validation_1.validate)(common_1.bulkDeleteSchema), (0, catchAsync_1.catchAsync)(packages_1.bulkDeletePackages));
// Query operations
router.get("/", (0, checkpermission_1.checkOnlyAdmin)(), (0, catchAsync_1.catchAsync)(packages_1.getAllPackages));
router.get("/select", (0, checkpermission_1.checkOnlyAdmin)(), (0, catchAsync_1.catchAsync)(packages_1.getPackagesSelection));
// CRUD operations
router.get("/:id", (0, checkpermission_1.checkOnlyAdmin)(), (0, validation_1.validate)(packages_2.packageIdParamSchema), (0, catchAsync_1.catchAsync)(packages_1.getPackageById));
router.post("/", (0, checkpermission_1.checkOnlyAdmin)(), (0, validation_1.validate)(packages_2.createPackageSchema), (0, catchAsync_1.catchAsync)(packages_1.createPackage));
router.put("/:id", (0, checkpermission_1.checkOnlyAdmin)(), (0, validation_1.validate)(packages_2.updatePackageSchema), (0, catchAsync_1.catchAsync)(packages_1.updatePackage));
router.delete("/:id", (0, checkpermission_1.checkOnlyAdmin)(), (0, validation_1.validate)(packages_2.packageIdParamSchema), (0, catchAsync_1.catchAsync)(packages_1.deletePackage));
exports.default = router;
