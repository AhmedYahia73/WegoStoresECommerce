import { Router } from "express";
import {
  getAllWalletOrders,
  getWalletOrdersLists,
  getWalletOrderById,
  createWalletOrder,
  changeWalletOrderStatus,
  deleteWalletOrder,
  bulkDeleteWalletOrders,
} from "../../controllers/super_admin/walletOrders";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { checkOnlyAdmin } from "../../middlewares/checkpermission";
import {
  createWalletOrderSchema,
  changeWalletOrderStatusSchema,
  walletOrderIdParamSchema,
} from "../../validators/super_admin/walletOrders";
import { bulkDeleteSchema } from "../../validators/super_admin/common";
import { uploadSingleFile } from "../../middlewares/upload";

const router = Router();

// Bulk delete operation (MUST precede /:id)
router.delete("/bulk", checkOnlyAdmin(), validate(bulkDeleteSchema), catchAsync(bulkDeleteWalletOrders));

// Query operations
router.get("/", checkOnlyAdmin(), catchAsync(getAllWalletOrders));
router.get("/lists", checkOnlyAdmin(), catchAsync(getWalletOrdersLists));

// Status change (Approve or Reject with reject_reason)
router.patch("/:id/status", checkOnlyAdmin(), validate(changeWalletOrderStatusSchema), catchAsync(changeWalletOrderStatus));

// CRUD operations
router.get("/:id", checkOnlyAdmin(), validate(walletOrderIdParamSchema), catchAsync(getWalletOrderById));
router.post("/", checkOnlyAdmin(), uploadSingleFile("receipt"), validate(createWalletOrderSchema), catchAsync(createWalletOrder));
router.delete("/:id", checkOnlyAdmin(), validate(walletOrderIdParamSchema), catchAsync(deleteWalletOrder));

export default router;
