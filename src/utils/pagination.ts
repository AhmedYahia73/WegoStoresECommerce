import { Request } from "express";

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function getPaginationParams(req: Request, defaultLimit = 10): PaginationParams {
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.max(1, parseInt(req.query.limit as string, 10) || defaultLimit);
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

export function buildPaginationMeta(total: number, page: number, limit: number): PaginationMeta {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}
