import http from "http";
import { readBoardsFromFile } from "./services/board.service.js";

const HTTP_PORT = Number(process.env.HTTP_PORT || 5000);

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/boards") {
    const boards = await readBoardsFromFile();
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ success: true, data: boards }));
  }
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ success: false, message: "Route not found" }));
});

server.listen(HTTP_PORT, () => {
  console.log(`HTTP Server running at http://localhost:${HTTP_PORT}`);
});
