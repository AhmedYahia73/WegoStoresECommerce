import { Router } from "express";
import {
  getAllUsers,
  getUsersSelection,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "../../controllers/super_admin/users";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { checkOnlyAdmin } from "../../middlewares/checkpermission";
import {
  createUserSchema,
  updateUserSchema,
  userIdParamSchema,
} from "../../validators/super_admin/users";

const router = Router();

router.get("/", checkOnlyAdmin(), catchAsync(getAllUsers));

router.get("/select", checkOnlyAdmin(), catchAsync(getUsersSelection));

router.get(
  "/:id",
  checkOnlyAdmin(),
  validate(userIdParamSchema),
  catchAsync(getUserById)
);

router.post(
  "/",
  checkOnlyAdmin(),
  validate(createUserSchema),
  catchAsync(createUser)
);

router.put(
  "/:id",
  checkOnlyAdmin(),
  validate(updateUserSchema),
  catchAsync(updateUser)
);

router.delete(
  "/:id",
  checkOnlyAdmin(),
  validate(userIdParamSchema),
  catchAsync(deleteUser)
);

export default router;
