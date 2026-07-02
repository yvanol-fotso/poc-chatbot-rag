interface Message {
  role: "user" | "assistant";
  content: string;
}

const conversations: Map<string, Message[]> = new Map();

export function getHistory(sessionId: string): Message[] {
  return conversations.get(sessionId) || [];
}

export function addMessage(sessionId: string, message: Message) {
  const history = conversations.get(sessionId) || [];
  history.push(message);
  conversations.set(sessionId, history);
}

export function clearHistory(sessionId: string) {
  conversations.delete(sessionId);
}