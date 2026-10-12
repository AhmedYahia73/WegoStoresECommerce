"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.catchAsync = catchAsync;
function catchAsync(fn) {
    const wrapped = (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
    // Attach original controller function name for automatic Swagger summary generation
    wrapped.__controllerName = fn.name;
    return wrapped;
}
