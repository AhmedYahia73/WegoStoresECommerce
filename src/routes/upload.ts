import { Router, Request, Response } from "express";
import { upload, getFileUrl } from "../middlewares/upload";
import { SuccessResponse } from "../utils/response";
import { BadRequest } from "../Errors/BadRequest";
import { catchAsync } from "../utils/catchAsync";

const router = Router();

// 1. Upload single image via multipart/form-data
router.post(
  "/",
  upload.single("image"),
  catchAsync(async (req: Request, res: Response) => {
    if (!req.file) {
      throw new BadRequest("No image file provided in form-data ('image')");
    }

    const url = getFileUrl(req, req.file);

    return SuccessResponse(
      res,
      {
        message: "Image uploaded successfully",
        url,
        filename: req.file.filename,
      },
      201
    );
  })
);

// 2. Upload multiple images via multipart/form-data
router.post(
  "/multiple",
  upload.array("images", 10),
  catchAsync(async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      throw new BadRequest("No image files provided in form-data ('images')");
    }

    const urls = files.map((file) => getFileUrl(req, file));

    return SuccessResponse(
      res,
      {
        message: "Images uploaded successfully",
        urls,
        count: urls.length,
      },
      201
    );
  })
);

export default router;
