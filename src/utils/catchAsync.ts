import { Response, Request, RequestHandler, NextFunction } from "express";

export function catchAsync(fn: RequestHandler) {
  const wrapped: RequestHandler = (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

  // Attach original controller function name for automatic Swagger summary generation
  (wrapped as any).__controllerName = fn.name;

  return wrapped;
}
