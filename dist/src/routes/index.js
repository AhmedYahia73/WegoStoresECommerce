"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const super_admin_1 = __importDefault(require("./super_admin"));
const upload_1 = __importDefault(require("./upload"));
const callbacks_1 = __importDefault(require("./callbacks"));
const route = (0, express_1.Router)();
route.use("/", callbacks_1.default);
route.use("/upload", upload_1.default);
route.use("/super_admin", super_admin_1.default);
exports.default = route;
