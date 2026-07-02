import { Router } from "express";
import { embedText } from "../services/embeddings";
import { searchSimilar } from "../services/vectorStore";
import { askLLM } from "../services/llm";
import { getHistory, addMessage, clearHistory } from "../services/conversationStore";

const router = Router();

router.post("/chat", async (req, res) => {
  const { question, sessionId } = req.body;

  if (!question) {
    return res.status(400).json({ error: "Le champ 'question' est requis" });
  }

  if (!sessionId) {
    return res.status(400).json({ error: "Le champ 'sessionId' est requis" });
  }

  try {
    const queryEmbedding = await embedText(question);
    const relevantChunks = await searchSimilar(queryEmbedding, 3);

    if (relevantChunks.length === 0) {
      return res.status(400).json({ error: "Aucun document indexé pour l'instant" });
    }

    const context = relevantChunks.map((c) => c.content).join("\n\n---\n\n");
    const history = getHistory(sessionId);

    const answer = await askLLM(question, context, history);

    // On sauvegarde l'échange dans l'historique
    addMessage(sessionId, { role: "user", content: question });
    addMessage(sessionId, { role: "assistant", content: answer });

    res.json({
      question,
      answer,
      sources: relevantChunks.map((c) => ({
        filename: c.filename,
        score: c.score,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la génération de la réponse" });
  }
});

// Route bonus : réinitialiser une conversation
router.post("/chat/reset", (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) {
    return res.status(400).json({ error: "Le champ 'sessionId' est requis" });
  }
  clearHistory(sessionId);
  res.json({ message: "Historique réinitialisé" });
});

export default router;