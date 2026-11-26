import { Router } from "express";
import { getPaymob, createOrUpdatePaymob } from "../../controllers/super_admin/paymob";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { checkOnlyAdmin } from "../../middlewares/checkpermission";
import { uploadSingleImage } from "../../middlewares/upload";
import { createUpdatePaymobSchema } from "../../validators/super_admin/paymob";

const router = Router();

router.get("/", checkOnlyAdmin(), catchAsync(getPaymob));
router.post(
  "/",
  checkOnlyAdmin(),
  uploadSingleImage("logo"),
  validate(createUpdatePaymobSchema),
  catchAsync(createOrUpdatePaymob)
);

export default router;
