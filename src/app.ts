import express, { Request, Response } from "express";
import dotenv from "dotenv";
import boardRoutes from "./routes/board.routes.js";
import cors from "cors";
import { errorHandler } from "./middlewares/error.middleware.js";

dotenv.config();

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/boards", boardRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
