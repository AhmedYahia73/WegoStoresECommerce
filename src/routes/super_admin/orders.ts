import { Router } from "express";
import { getAllOrders, getOrdersLists } from "../../controllers/super_admin/orders";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { checkOnlyAdmin } from "../../middlewares/checkpermission";
import { getOrdersSummarySchema } from "../../validators/super_admin/orders";

const router = Router();

router.get("/", checkOnlyAdmin(), validate(getOrdersSummarySchema), catchAsync(getAllOrders));
router.get("/lists", checkOnlyAdmin(), catchAsync(getOrdersLists));

export default router;
