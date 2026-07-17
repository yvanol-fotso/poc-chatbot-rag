import Groq from "groq-sdk";
import { askLLM } from "../llm";
import { getHistory } from "../conversationStore";
import { queryGraph } from "./graphStore";
import { RagResult } from "./types";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Demande au LLM d'identifier les entités clés mentionnées dans la question,
 * pour cibler la recherche dans le graphe.
 */
async function extractQuestionEntities(question: string): Promise<string[]> {
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: `Extrait les 1 à 5 entités/concepts clés de la question suivante.
Réponds STRICTEMENT en JSON : { "entities": ["string", ...] }, sans texte autour.`,
      },
      { role: "user", content: question },
    ],
    temperature: 0,
    response_format: { type: "json_object" },
  });

  try {
    const parsed = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
    return Array.isArray(parsed.entities) ? parsed.entities : [];
  } catch {
    return [];
  }
}

export async function askGraphRag(
  question: string,
  sessionId: string
): Promise<RagResult> {
  const entityNames = await extractQuestionEntities(question);

  if (entityNames.length === 0) {
    return {
      answer:
        "Je n'ai pas réussi à identifier de concepts clés dans votre question pour interroger le graphe de connaissances.",
      sources: [],
    };
  }

  const matches = await queryGraph(entityNames, sessionId);

  if (matches.length === 0) {
    return {
      answer:
        "Aucune information trouvée dans le graphe de connaissances pour cette conversation.",
      sources: [],
    };
  }

  const context = matches
    .map((m) => `${m.entity} (${m.type}) :\n${m.relatedFacts.join("\n")}`)
    .join("\n\n---\n\n");

  const history = await getHistory(sessionId);
  const answer = await askLLM(question, context, history);

  const sourceSet = new Set<string>();
  matches.forEach((m) => m.sources.forEach((s) => sourceSet.add(s)));

  return {
    answer,
    sources: Array.from(sourceSet).map((filename) => ({ filename, score: 1 })),
  };
}

export { closeGraphDriver } from "./graphStore";