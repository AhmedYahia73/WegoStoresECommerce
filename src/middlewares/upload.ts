import multer from "multer";
import path from "path";
import fs from "fs";
import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import { BadRequest } from "../Errors/BadRequest";

const uploadsDir = path.join(__dirname, "../..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".png";
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new BadRequest("Only image files are allowed"));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit
  },
});

/**
 * Middleware to parse stringified JSON objects/arrays sent in multipart/form-data text fields.
 */
export function parseFormDataJson(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === "object") {
    for (const key of Object.keys(req.body)) {
      const val = req.body[key];
      if (typeof val === "string") {
        const trimmed = val.trim();
        if (
          (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
          (trimmed.startsWith("[") && trimmed.endsWith("]"))
        ) {
          try {
            req.body[key] = JSON.parse(trimmed);
          } catch {
            // Keep original string
          }
        } else if (trimmed === "true") {
          req.body[key] = true;
        } else if (trimmed === "false") {
          req.body[key] = false;
        } else if (trimmed === "null") {
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
export function getFileUrl(req: Request, file: Express.Multer.File): string {
  return `${req.protocol}://${req.get("host")}/uploads/${file.filename}`;
}

/**
 * Middleware for single image upload via multipart/form-data.
 */
export function uploadSingleImage(fieldName: string = "image") {
  const multerMiddleware = upload.single(fieldName);
  return (req: Request, res: Response, next: NextFunction) => {
    multerMiddleware(req, res, (err: any) => {
      if (err) return next(err);
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
export function uploadMultipleImages(fieldName: string = "image", maxCount: number = 10) {
  const multerMiddleware = upload.array(fieldName, maxCount);
  return (req: Request, res: Response, next: NextFunction) => {
    multerMiddleware(req, res, (err: any) => {
      if (err) return next(err);
      parseFormDataJson(req, res, () => {
        const files = req.files as Express.Multer.File[] | undefined;
        if (files && files.length > 0) {
          const uploadedUrls = files.map((f) => getFileUrl(req, f));
          if (Array.isArray(req.body[fieldName])) {
            req.body[fieldName] = [...req.body[fieldName], ...uploadedUrls];
          } else {
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
export function uploadFieldsImages(fields: { name: string; maxCount?: number }[]) {
  const multerMiddleware = upload.fields(fields);
  return (req: Request, res: Response, next: NextFunction) => {
    multerMiddleware(req, res, (err: any) => {
      if (err) return next(err);
      parseFormDataJson(req, res, () => {
        const filesMap = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
        if (filesMap) {
          for (const field of fields) {
            const fileList = filesMap[field.name];
            if (fileList && fileList.length > 0) {
              if (field.maxCount === 1 || !field.maxCount) {
                req.body[field.name] = getFileUrl(req, fileList[0]);
              } else {
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
