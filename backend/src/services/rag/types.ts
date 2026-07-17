export interface RagSource {
  filename: string;
  score: number;
}

export interface RagResult {
  answer: string;
  sources: RagSource[];
}

export interface Message {
  role: "user" | "assistant";
  content: string;
}