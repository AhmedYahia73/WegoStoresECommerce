import { Router } from "express";
import { getSettings, upsertSettings } from "../../controllers/super_admin/settings";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { checkOnlyAdmin } from "../../middlewares/checkpermission";
import { upsertSettingsSchema } from "../../validators/super_admin/settings";

const router = Router();

router.get("/", checkOnlyAdmin(), catchAsync(getSettings));
router.post("/", checkOnlyAdmin(), validate(upsertSettingsSchema), catchAsync(upsertSettings));

export default router;
