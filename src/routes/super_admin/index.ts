import { Router } from "express";
import { authenticated } from "../../middlewares/authenticated";
import authRouter from "./auth";
import adminsRouter from "./admins";
import paymentMethodsRouter from "./paymentMethods";
import usersRouter from "./users";

const router = Router();

// Public Super Admin Auth Route (Login via `admins` table)
router.use("/auth", authRouter);

// Protected Super Admin Routes (Must be logged in at `admins` table)
router.use(authenticated);
router.use("/admins", adminsRouter);
router.use("/payment_methods", paymentMethodsRouter);
router.use("/users", usersRouter);

export default router;
