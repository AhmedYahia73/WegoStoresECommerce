import { Router } from "express";
import {
  getAllUserOrders,
  getUserOrdersLists,
  getUserOrderById,
  createUserOrder,
  changeUserOrderStatus,
  deleteUserOrder,
  bulkDeleteUserOrders,
} from "../../controllers/super_admin/userOrders";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { checkOnlyAdmin } from "../../middlewares/checkpermission";
import {
  createUserOrderSchema,
  changeUserOrderStatusSchema,
  userOrderIdParamSchema,
} from "../../validators/super_admin/userOrders";
import { bulkDeleteSchema } from "../../validators/super_admin/common";

const router = Router();

// Bulk delete operations (MUST precede /:id)
router.post("/bulk-delete", checkOnlyAdmin(), validate(bulkDeleteSchema), catchAsync(bulkDeleteUserOrders));
router.delete("/bulk", checkOnlyAdmin(), validate(bulkDeleteSchema), catchAsync(bulkDeleteUserOrders));

// Query operations
router.get("/", checkOnlyAdmin(), catchAsync(getAllUserOrders));
router.get("/lists", checkOnlyAdmin(), catchAsync(getUserOrdersLists));

// Status change (Approve or Reject with reject_reason)
router.patch("/:id/status", checkOnlyAdmin(), validate(changeUserOrderStatusSchema), catchAsync(changeUserOrderStatus));
router.put("/:id/status", checkOnlyAdmin(), validate(changeUserOrderStatusSchema), catchAsync(changeUserOrderStatus));

// CRUD operations
router.get("/:id", checkOnlyAdmin(), validate(userOrderIdParamSchema), catchAsync(getUserOrderById));
router.post("/", checkOnlyAdmin(), validate(createUserOrderSchema), catchAsync(createUserOrder));
router.delete("/:id", checkOnlyAdmin(), validate(userOrderIdParamSchema), catchAsync(deleteUserOrder));

export default router;
