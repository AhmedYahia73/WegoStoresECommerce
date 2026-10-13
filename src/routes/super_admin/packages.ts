import { Router } from "express";
import {
  getAllPackages,
  getPackagesSelection,
  getPackageById,
  createPackage,
  updatePackage,
  deletePackage,
  bulkDeletePackages,
} from "../../controllers/super_admin/packages";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { checkOnlyAdmin } from "../../middlewares/checkpermission";
import {
  createPackageSchema,
  updatePackageSchema,
  packageIdParamSchema,
} from "../../validators/super_admin/packages";
import { bulkDeleteSchema } from "../../validators/super_admin/common";

const router = Router();

// Bulk delete operations (MUST precede /:id)
router.post("/bulk-delete", checkOnlyAdmin(), validate(bulkDeleteSchema), catchAsync(bulkDeletePackages));
router.delete("/bulk", checkOnlyAdmin(), validate(bulkDeleteSchema), catchAsync(bulkDeletePackages));

// Query operations
router.get("/", checkOnlyAdmin(), catchAsync(getAllPackages));
router.get("/select", checkOnlyAdmin(), catchAsync(getPackagesSelection));

// CRUD operations
router.get("/:id", checkOnlyAdmin(), validate(packageIdParamSchema), catchAsync(getPackageById));
router.post("/", checkOnlyAdmin(), validate(createPackageSchema), catchAsync(createPackage));
router.put("/:id", checkOnlyAdmin(), validate(updatePackageSchema), catchAsync(updatePackage));
router.delete("/:id", checkOnlyAdmin(), validate(packageIdParamSchema), catchAsync(deletePackage));

export default router;
