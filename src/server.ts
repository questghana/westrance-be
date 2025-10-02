// import { prepareProductionStance } from "./configs/prepareproductionstance.config";
import { assignSocketToReqIO } from "@/middlewares/socket.middleware";
// import { authorizeUser } from "@/middlewares/socket.middleware";
import { prepareMigration } from "./utils/preparemigration.util";
// import { throttle } from "./middlewares/throttle.middleware";
import { registerEvents } from "@/utils/registerevents.util";
// import { sessionOptions } from "./configs/session.config";
import unknownRoutes from "@/routes/unknown.routes";
import { swagger } from "@/configs/swagger.config";
import { toNodeHandler } from "better-auth/node";
import { logger } from "@/utils/logger.util";
import cors, { CorsOptions } from "cors";
import cookieParser from "cookie-parser";
// import session from "express-session";
import { createServer } from "http";
import { Server } from "socket.io";
import { config } from "dotenv";
import express from "express";
import morgan from "morgan";
import helmet from "helmet";
import { companyregisterRoutes } from "./routes/register.routes";
import { addEmployeeRoutes } from "./routes/employee.routes";
import { signInRoutes } from "./routes/signin.routes";
import { ticketRoutes } from "./routes/ticket.routes";
import { HospitalRoutes } from "./routes/hospital.routes";
import { auth } from "./lib/auth";
import { adminRoute } from "./routes/admin.routes";

config();
const app = express();
const httpServer = createServer(app);
const port = Number(process.env.PORT) || 3000;
// const sessionMiddleware = session(sessionOptions);
const isProduction = app.get("env") === "production";

const corsOptions: CorsOptions = {
  origin: ["http://localhost:4000", "https://westrance-fe.vercel.app"], 
  credentials: true,
};
// console.log(process.env.FRONTEND_DOMAIN)
const io = new Server(httpServer, {
  cors: corsOptions,
});

swagger(app);
// prepareProductionStance({ isProduction, app, sessionOptions });
prepareMigration(isProduction);

app.use(helmet());
io.on("connection", registerEvents);
app.use(express.static("public"));
// io.engine.use(sessionMiddleware);
app.use(assignSocketToReqIO(io));
app.use(express.static("dist"));
app.use(cors(corsOptions));
app.use(cookieParser());
// io.use(authorizeUser);

app.use(morgan("dev"));
app.all("/api/auth/*", toNodeHandler(auth));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
// app.use(throttle("default"));
// app.get("/temp-auth-me", (_, res) => {
//   console.log("Temporary /temp-auth-me route hit.");
//   res.json({ message: "Temporary Auth Me route works!" });
// });
// app.get("/api/auth/me", authme); // Directly added to server.ts
app.get("/test", (_, res) => {
  res.json("test server chala bro?");
  console.log(port, "Port Running 🎅");
});
app.use("/api", signInRoutes);
app.use("/api/company", companyregisterRoutes);
app.use("/api/employee", addEmployeeRoutes);
app.use("/api/ticket", ticketRoutes);
app.use("/api/hospital", HospitalRoutes);
app.use("/api/admin", adminRoute);
app.use("*", unknownRoutes)

httpServer.listen(port as number, () => {
  logger.info(`server is running on port: ${port}`);
  logger.info(`Docs are available at \n/api/docs and /api/docs-json`);
});
