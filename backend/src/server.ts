import "dotenv/config";
import express from "express";
import uploadRoutes from "./routes/upload";
import chatRoutes from "./routes/chat";
import cors from "cors";

const app = express();
const PORT = 3000;

app.use(express.json());

app.use(cors());
app.use("/api", uploadRoutes);
app.use("/api", chatRoutes);

app.get("/", (req, res) => {
  res.send("Test backend RAG operationnel");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});