import { Router } from "express";
import { paymobCallback } from "../controllers/callbacks/paymobCallback";
import { catchAsync } from "../utils/catchAsync";

const router = Router();

router.post("/paymob_callback", catchAsync(paymobCallback));
router.get("/paymob_callback", catchAsync(paymobCallback));

export default router;
