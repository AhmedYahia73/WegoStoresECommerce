"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const paymobCallback_1 = require("../controllers/callbacks/paymobCallback");
const catchAsync_1 = require("../utils/catchAsync");
const router = (0, express_1.Router)();
router.post("/paymob_callback", (0, catchAsync_1.catchAsync)(paymobCallback_1.paymobCallback));
router.get("/paymob_callback", (0, catchAsync_1.catchAsync)(paymobCallback_1.paymobCallback));
exports.default = router;
