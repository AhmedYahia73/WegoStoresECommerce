import { Router } from "express";
import {
  getAllDiscounts,
  getDiscountsSelection,
  getDiscountById,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  bulkDeleteDiscounts,
} from "../../controllers/super_admin/discounts";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { checkOnlyAdmin } from "../../middlewares/checkpermission";
import {
  createDiscountSchema,
  updateDiscountSchema,
  discountIdParamSchema,
} from "../../validators/super_admin/discounts";
import { bulkDeleteSchema } from "../../validators/super_admin/common";

const router = Router();

// Bulk delete operations (MUST precede /:id)
router.post("/bulk-delete", checkOnlyAdmin(), validate(bulkDeleteSchema), catchAsync(bulkDeleteDiscounts));
router.delete("/bulk", checkOnlyAdmin(), validate(bulkDeleteSchema), catchAsync(bulkDeleteDiscounts));

// Query operations
router.get("/", checkOnlyAdmin(), catchAsync(getAllDiscounts));
router.get("/select", checkOnlyAdmin(), catchAsync(getDiscountsSelection));

// CRUD operations
router.get("/:id", checkOnlyAdmin(), validate(discountIdParamSchema), catchAsync(getDiscountById));
router.post("/", checkOnlyAdmin(), validate(createDiscountSchema), catchAsync(createDiscount));
router.put("/:id", checkOnlyAdmin(), validate(updateDiscountSchema), catchAsync(updateDiscount));
router.delete("/:id", checkOnlyAdmin(), validate(discountIdParamSchema), catchAsync(deleteDiscount));

export default router;
