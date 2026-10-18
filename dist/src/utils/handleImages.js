"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImage = uploadImage;
exports.deleteImage = deleteImage;
exports.updateImage = updateImage;
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
/**
 * 1. Process and resolve image URL to store in DB.
 * Accepts Multer file, HTTP(S) URL, or relative path.
 */
async function uploadImage(req, fileOrUrl, _folder = "uploads") {
    if (!fileOrUrl)
        return "";
    if (typeof fileOrUrl === "object" && "filename" in fileOrUrl) {
        return `${req.protocol}://${req.get("host")}/uploads/${fileOrUrl.filename}`;
    }
    if (typeof fileOrUrl === "string") {
        if (fileOrUrl.startsWith("http://") || fileOrUrl.startsWith("https://")) {
            return fileOrUrl;
        }
        const clean = fileOrUrl.startsWith("/") ? fileOrUrl.slice(1) : fileOrUrl;
        if (clean.startsWith("uploads/")) {
            return `${req.protocol}://${req.get("host")}/${clean}`;
        }
        return `${req.protocol}://${req.get("host")}/uploads/${clean}`;
    }
    return "";
}
/**
 * 2. Delete an existing image physically from `uploads` folder.
 */
async function deleteImage(imageUrlOrPath) {
    if (!imageUrlOrPath)
        return false;
    try {
        let relativePath = imageUrlOrPath;
        if (imageUrlOrPath.startsWith("http://") || imageUrlOrPath.startsWith("https://")) {
            const url = new URL(imageUrlOrPath);
            relativePath = url.pathname.startsWith("/")
                ? url.pathname.slice(1)
                : url.pathname;
        }
        const filePath = path_1.default.join(__dirname, "../..", relativePath);
        await promises_1.default.access(filePath);
        await promises_1.default.unlink(filePath);
        return true;
    }
    catch (err) {
        return false;
    }
}
/**
 * 3. Update an image: deletes old image (if changed) and returns new URL.
 */
async function updateImage(req, newFileOrUrl, folder = "uploads", oldImageUrlOrPath) {
    const newUrl = await uploadImage(req, newFileOrUrl, folder);
    if (oldImageUrlOrPath && newUrl && oldImageUrlOrPath !== newUrl) {
        await deleteImage(oldImageUrlOrPath);
    }
    return newUrl;
}
