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

const allowedOrigins = [process.env.CLIENT_ORIGIN];

const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true, 
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/auth", authRoutes);
app.use("/boards", boardRoutes);
app.use("/:boardId/columns", columnRoutes)
app.use("/:boardId/columns/:columnId", taskRoutes)


app.use(errorHandler);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
