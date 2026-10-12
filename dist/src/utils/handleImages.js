"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImage = uploadImage;
exports.deleteImage = deleteImage;
exports.updateImage = updateImage;
exports.saveBase64Image = saveBase64Image;
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const uuid_1 = require("uuid");
const BadRequest_1 = require("../Errors/BadRequest");
/**
 * 1. Upload/Save a new Base64 image into `uploads/{folder}` and return its URL to store in DB.
 */
async function uploadImage(req, base64, folder) {
    const matches = base64.match(/^data:(.+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
        throw new BadRequest_1.BadRequest("Invalid base64 image format");
    }
    const mimeType = matches[1];
    const ext = mimeType.split("/")[1] || "png";
    const buffer = Buffer.from(matches[2], "base64");
    const fileName = `${(0, uuid_1.v4)()}.${ext}`;
    const uploadsDir = path_1.default.join(__dirname, "../..", "uploads", folder);
    await promises_1.default.mkdir(uploadsDir, { recursive: true });
    const filePath = path_1.default.join(uploadsDir, fileName);
    await promises_1.default.writeFile(filePath, buffer);
    const relativePath = `uploads/${folder}/${fileName}`;
    const imageUrl = `${req.protocol}://${req.get("host")}/${relativePath}`;
    return imageUrl;
}
/**
 * 2. Delete an existing image from `uploads` folder (accepts full URL or relative path).
 */
async function deleteImage(imageUrlOrPath) {
    if (!imageUrlOrPath)
        return false;
    try {
        let relativePath = imageUrlOrPath;
        if (imageUrlOrPath.startsWith("http")) {
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
        console.error("Error deleting photo:", err);
        return false;
    }
}
/**
 * 3. Update an image: deletes the old image first (if it exists), saves the new image in `uploads/{folder}`,
 * and returns the new URL to store in DB.
 */
async function updateImage(req, newBase64, folder, oldImageUrlOrPath) {
    if (oldImageUrlOrPath) {
        await deleteImage(oldImageUrlOrPath);
    }
    return await uploadImage(req, newBase64, folder);
}
// Backward-compatible helper
async function saveBase64Image(req, base64, folder) {
    const url = await uploadImage(req, base64, folder);
    const parsed = new URL(url);
    const relativePath = parsed.pathname.startsWith("/")
        ? parsed.pathname.slice(1)
        : parsed.pathname;
    return { url, relativePath };
}
