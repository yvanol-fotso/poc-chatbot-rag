import { askNaiveRag } from "./naiveRag";
import { askGraphRag } from "./graphRag";
import { RagResult } from "./types";

const strategy = process.env.RAG_STRATEGY ?? "naive"; // "naive" | "graph"

export async function askRag(
  question: string,
  sessionId: string
): Promise<RagResult> {
  return strategy === "graph"
    ? askGraphRag(question, sessionId)
    : askNaiveRag(question, sessionId);
}