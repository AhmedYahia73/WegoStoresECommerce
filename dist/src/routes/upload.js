"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const upload_1 = require("../middlewares/upload");
const response_1 = require("../utils/response");
const BadRequest_1 = require("../Errors/BadRequest");
const catchAsync_1 = require("../utils/catchAsync");
const router = (0, express_1.Router)();
// 1. Upload single image via multipart/form-data
router.post("/", upload_1.upload.single("image"), (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.file) {
        throw new BadRequest_1.BadRequest("No image file provided in form-data ('image')");
    }
    const url = (0, upload_1.getFileUrl)(req, req.file);
    return (0, response_1.SuccessResponse)(res, {
        message: "Image uploaded successfully",
        url,
        filename: req.file.filename,
    }, 201);
}));
// 2. Upload multiple images via multipart/form-data
router.post("/multiple", upload_1.upload.array("images", 10), (0, catchAsync_1.catchAsync)(async (req, res) => {
    const files = req.files;
    if (!files || files.length === 0) {
        throw new BadRequest_1.BadRequest("No image files provided in form-data ('images')");
    }
    const urls = files.map((file) => (0, upload_1.getFileUrl)(req, file));
    return (0, response_1.SuccessResponse)(res, {
        message: "Images uploaded successfully",
        urls,
        count: urls.length,
    }, 201);
}));
exports.default = router;
