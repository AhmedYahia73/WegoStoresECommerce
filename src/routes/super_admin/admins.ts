import { Router } from "express";
import {
  getAllAdmin,
  getAdminById,
  createAdmin,
  updateAdmin,
  deleteAdmin,
} from "../../controllers/super_admin/admins";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { checkOnlyAdmin } from "../../middlewares/checkpermission";
import {
  createAdminSchema,
  updateAdminSchema,
  adminIdParamSchema,
} from "../../validators/super_admin/admins";

const router = Router();

router.get("/", checkOnlyAdmin(), catchAsync(getAllAdmin));

router.get(
  "/:id",
  checkOnlyAdmin(),
  validate(adminIdParamSchema),
  catchAsync(getAdminById)
);

router.post(
  "/",
  checkOnlyAdmin(),
  validate(createAdminSchema),
  catchAsync(createAdmin)
);

router.put(
  "/:id",
  checkOnlyAdmin(),
  validate(updateAdminSchema),
  catchAsync(updateAdmin)
);

router.delete(
  "/:id",
  checkOnlyAdmin(),
  validate(adminIdParamSchema),
  catchAsync(deleteAdmin)
);

export default router;
