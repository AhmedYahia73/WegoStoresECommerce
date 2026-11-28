import { Router } from "express";
import { signup } from "../controllers/auth/auth";
import { catchAsync } from "../utils/catchAsync";
import { validate } from "../middlewares/validation";
import { tenantSignupSchema } from "../validators/auth";

const router = Router();

// Public Tenant Signup (No auth required)
router.post("/signup", validate(tenantSignupSchema), catchAsync(signup));

export default router;
