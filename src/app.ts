import "dotenv/config";
import express from "express";
import boardRoutes from "./routes/board.routes.js";
import authRoutes from "./routes/auth.routes.js";
import columnRoutes from "./routes/column.routes.js";
import taskRoutes from "./routes/task.routes.js";
import cors from "cors";
import { errorHandler } from "./middlewares/error.middleware.js";
import connectDB from "./config/db.js";
import cookieParser from "cookie-parser";

connectDB();
const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/auth", authRoutes);
app.use("/boards", boardRoutes);
app.use("/:boardId/columns", columnRoutes)
app.use("/:boardId/columns", taskRoutes)


app.use(errorHandler);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
