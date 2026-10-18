import express from "express";
import path from "path";
import { setupSwagger } from "./config/swagger";
import ApiRoute from "./routes";
import { errorHandler } from "./middlewares/errorHandler";
import { NotFound } from "./Errors";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import http from "http";
import { Server } from "socket.io";

dotenv.config();

const app = express();
app.set("trust proxy", true);

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
    ],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// تفعيل Swagger مع قراءة الـ Routes والـ Zod Validators تلقائياً
setupSwagger(app, ApiRoute);

app.get("/api/test", (req, res, next) => {
  res.json({ message: "API is working! notify token" });
});

app.use("/api", ApiRoute);

app.use((req, res, next) => {
  throw new NotFound("Route not found");
});

app.use(errorHandler);

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});