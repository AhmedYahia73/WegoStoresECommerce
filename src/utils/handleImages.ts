import path from "path";
import fs from "fs/promises";
import { Request } from "express";

/**
 * 1. Process and resolve image URL to store in DB.
 * Accepts Multer file, HTTP(S) URL, or relative path.
 */
export async function uploadImage(
  req: Request,
  fileOrUrl?: string | Express.Multer.File | null,
  _folder: string = "uploads"
): Promise<string> {
  if (!fileOrUrl) return "";

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
export async function deleteImage(
  imageUrlOrPath?: string | null
): Promise<boolean> {
  if (!imageUrlOrPath) return false;

  try {
    let relativePath = imageUrlOrPath;

    if (imageUrlOrPath.startsWith("http://") || imageUrlOrPath.startsWith("https://")) {
      const url = new URL(imageUrlOrPath);
      relativePath = url.pathname.startsWith("/")
        ? url.pathname.slice(1)
        : url.pathname;
    }

    const filePath = path.join(__dirname, "../..", relativePath);

    await fs.access(filePath);
    await fs.unlink(filePath);

    return true;
  } catch (err) {
    return false;
  }
}

/**
 * 3. Update an image: deletes old image (if changed) and returns new URL.
 */
export async function updateImage(
  req: Request,
  newFileOrUrl?: string | Express.Multer.File | null,
  folder: string = "uploads",
  oldImageUrlOrPath?: string | null
): Promise<string> {
  const newUrl = await uploadImage(req, newFileOrUrl, folder);
  if (oldImageUrlOrPath && newUrl && oldImageUrlOrPath !== newUrl) {
    await deleteImage(oldImageUrlOrPath);
  }
  return newUrl;
}
