import path from "path";
import fs from "fs/promises";
import { Request } from "express";
import { v4 as uuidv4 } from "uuid";
import { BadRequest } from "../Errors/BadRequest";

/**
 * 1. Upload/Save a new Base64 image into `uploads` and return its URL to store in DB.
 */
export async function uploadImage(
  req: Request,
  base64: string,
  folder: string = "uploads"
): Promise<string> {
  const matches = base64.match(/^data:(.+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new BadRequest("Invalid base64 image format");
  }

  const mimeType = matches[1];
  const ext = mimeType.split("/")[1] || "png";
  const buffer = Buffer.from(matches[2], "base64");

  const fileName = `${uuidv4()}.${ext}`;
  const uploadsDir =
    folder === "uploads"
      ? path.join(__dirname, "../..", "uploads")
      : path.join(__dirname, "../..", "uploads", folder);

  await fs.mkdir(uploadsDir, { recursive: true });

  const filePath = path.join(uploadsDir, fileName);
  await fs.writeFile(filePath, buffer);

  const relativePath =
    folder === "uploads"
      ? `uploads/${fileName}`
      : `uploads/${folder}/${fileName}`;
  const imageUrl = `${req.protocol}://${req.get("host")}/${relativePath}`;

  return imageUrl;
}

/**
 * 2. Delete an existing image from `uploads` folder (accepts full URL or relative path).
 */
export async function deleteImage(
  imageUrlOrPath?: string | null
): Promise<boolean> {
  if (!imageUrlOrPath) return false;

  try {
    let relativePath = imageUrlOrPath;

    if (imageUrlOrPath.startsWith("http")) {
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
    console.error("Error deleting photo:", err);
    return false;
  }
}

/**
 * 3. Update an image: deletes the old image first (if it exists), saves the new image in `uploads`,
 * and returns the new URL to store in DB.
 */
export async function updateImage(
  req: Request,
  newBase64: string,
  folder: string = "uploads",
  oldImageUrlOrPath?: string | null
): Promise<string> {
  if (oldImageUrlOrPath) {
    await deleteImage(oldImageUrlOrPath);
  }
  return await uploadImage(req, newBase64, folder);
}

// Backward-compatible helper
export async function saveBase64Image(
  req: Request,
  base64: string,
  folder: string = "uploads"
): Promise<{ url: string; relativePath: string }> {
  const url = await uploadImage(req, base64, folder);
  const parsed = new URL(url);
  const relativePath = parsed.pathname.startsWith("/")
    ? parsed.pathname.slice(1)
    : parsed.pathname;
  return { url, relativePath };
}
