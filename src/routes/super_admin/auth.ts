import { Router } from "express";
import { loginAdmin } from "../../controllers/super_admin/auth";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { adminLoginSchema } from "../../validators/super_admin/auth";

const router = Router();

router.post("/login", validate(adminLoginSchema), catchAsync(loginAdmin));

export default router;
