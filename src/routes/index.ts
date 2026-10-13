import { Router } from "express";
import superAdminRoute from "./super_admin";
import uploadRoute from "./upload";

const route = Router();

route.use("/upload", uploadRoute);
route.use("/super_admin", superAdminRoute);

export default route;
