import { Router } from "express";
import {
  getAllPaymentMethods,
  getPaymentMethodsSelection,
  getPaymentMethodById,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} from "../../controllers/super_admin/paymentMethods";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { checkOnlyAdmin } from "../../middlewares/checkpermission";
import {
  createPaymentMethodSchema,
  updatePaymentMethodSchema,
  paymentMethodIdParamSchema,
} from "../../validators/super_admin/paymentMethods";

const router = Router();

router.get("/", checkOnlyAdmin(), catchAsync(getAllPaymentMethods));

router.get("/select", checkOnlyAdmin(), catchAsync(getPaymentMethodsSelection));

router.get(
  "/:id",
  checkOnlyAdmin(),
  validate(paymentMethodIdParamSchema),
  catchAsync(getPaymentMethodById)
);

router.post(
  "/",
  checkOnlyAdmin(),
  validate(createPaymentMethodSchema),
  catchAsync(createPaymentMethod)
);

router.put(
  "/:id",
  checkOnlyAdmin(),
  validate(updatePaymentMethodSchema),
  catchAsync(updatePaymentMethod)
);

router.delete(
  "/:id",
  checkOnlyAdmin(),
  validate(paymentMethodIdParamSchema),
  catchAsync(deletePaymentMethod)
);

export default router;
