"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaginationParams = getPaginationParams;
exports.buildPaginationMeta = buildPaginationMeta;
function getPaginationParams(req, defaultLimit = 10) {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || defaultLimit);
    const offset = (page - 1) * limit;
    return { page, limit, offset };
}
function buildPaginationMeta(total, page, limit) {
    return {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
    };
}
