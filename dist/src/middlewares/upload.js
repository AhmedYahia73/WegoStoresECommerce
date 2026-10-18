"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
exports.parseFormDataJson = parseFormDataJson;
exports.getFileUrl = getFileUrl;
exports.uploadSingleImage = uploadSingleImage;
exports.uploadMultipleImages = uploadMultipleImages;
exports.uploadFieldsImages = uploadFieldsImages;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
const BadRequest_1 = require("../Errors/BadRequest");
const uploadsDir = path_1.default.join(__dirname, "../..", "uploads");
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
        const ext = path_1.default.extname(file.originalname).toLowerCase() || ".png";
        cb(null, `${(0, uuid_1.v4)()}${ext}`);
    },
});
const fileFilter = (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    }
    else {
        cb(new BadRequest_1.BadRequest("Only image files are allowed"));
    }
};
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 15 * 1024 * 1024, // 15MB limit
    },
});
/**
 * Middleware to parse stringified JSON objects/arrays sent in multipart/form-data text fields.
 */
function parseFormDataJson(req, _res, next) {
    if (req.body && typeof req.body === "object") {
        for (const key of Object.keys(req.body)) {
            const val = req.body[key];
            if (typeof val === "string") {
                const trimmed = val.trim();
                if ((trimmed.startsWith("{") && trimmed.endsWith("}")) ||
                    (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
                    try {
                        req.body[key] = JSON.parse(trimmed);
                    }
                    catch {
                        // Keep original string
                    }
                }
                else if (trimmed === "true") {
                    req.body[key] = true;
                }
                else if (trimmed === "false") {
                    req.body[key] = false;
                }
                else if (trimmed === "null") {
                    req.body[key] = null;
                }
            }
        }
    }
    next();
}
/**
 * Build absolute public URL for an uploaded file
 */
function getFileUrl(req, file) {
    return `${req.protocol}://${req.get("host")}/uploads/${file.filename}`;
}
/**
 * Middleware for single image upload via multipart/form-data.
 */
function uploadSingleImage(fieldName = "image") {
    const multerMiddleware = exports.upload.single(fieldName);
    return (req, res, next) => {
        multerMiddleware(req, res, (err) => {
            if (err)
                return next(err);
            parseFormDataJson(req, res, () => {
                if (req.file) {
                    req.body[fieldName] = getFileUrl(req, req.file);
                }
                next();
            });
        });
    };
}
/**
 * Middleware for multiple images upload under the same fieldName.
 */
function uploadMultipleImages(fieldName = "image", maxCount = 10) {
    const multerMiddleware = exports.upload.array(fieldName, maxCount);
    return (req, res, next) => {
        multerMiddleware(req, res, (err) => {
            if (err)
                return next(err);
            parseFormDataJson(req, res, () => {
                const files = req.files;
                if (files && files.length > 0) {
                    const uploadedUrls = files.map((f) => getFileUrl(req, f));
                    if (Array.isArray(req.body[fieldName])) {
                        req.body[fieldName] = [...req.body[fieldName], ...uploadedUrls];
                    }
                    else {
                        req.body[fieldName] = uploadedUrls;
                    }
                }
                next();
            });
        });
    };
}
/**
 * Middleware for handling multiple distinct image fields.
 */
function uploadFieldsImages(fields) {
    const multerMiddleware = exports.upload.fields(fields);
    return (req, res, next) => {
        multerMiddleware(req, res, (err) => {
            if (err)
                return next(err);
            parseFormDataJson(req, res, () => {
                const filesMap = req.files;
                if (filesMap) {
                    for (const field of fields) {
                        const fileList = filesMap[field.name];
                        if (fileList && fileList.length > 0) {
                            if (field.maxCount === 1 || !field.maxCount) {
                                req.body[field.name] = getFileUrl(req, fileList[0]);
                            }
                            else {
                                req.body[field.name] = fileList.map((f) => getFileUrl(req, f));
                            }
                        }
                    }
                }
                next();
            });
        });
    };
}
