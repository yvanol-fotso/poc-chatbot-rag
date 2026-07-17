import { embedText } from "../embeddings";
import { searchSimilar } from "../vectorStore";
import { askLLM } from "../llm";
import { getHistory } from "../conversationStore";
import { RagResult } from "./types";

const TOP_K = 3;

export async function askNaiveRag(
  question: string,
  sessionId: string
): Promise<RagResult> {
  const queryEmbedding = await embedText(question);
  const matches = await searchSimilar(queryEmbedding, sessionId, TOP_K);

  if (matches.length === 0) {
    return {
      answer: "Aucun document indexé pour cette conversation.",
      sources: [],
    };
  }

  const context = matches.map((m) => m.content).join("\n\n---\n\n");
  const history = await getHistory(sessionId);
  const answer = await askLLM(question, context, history);

  return {
    answer,
    sources: matches.map((m) => ({ filename: m.filename, score: m.score })),
  };
}