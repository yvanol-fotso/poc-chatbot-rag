export interface Chunk {
  id: number;
  content: string;
}

export function chunkText(
  text: string,
  chunkSize: number = 300,   //  test avec 300 mots par chunk
  overlap: number = 50
): Chunk[] {
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const chunks: Chunk[] = [];

  let i = 0;
  let chunkId = 0;

  while (i < words.length) {
    const chunkWords = words.slice(i, i + chunkSize);
    chunks.push({
      id: chunkId,
      content: chunkWords.join(" "),
    });

    chunkId++;
    i += chunkSize - overlap;  // on recule un peu pour garder du contexte entre chunks
  }

  return chunks;
}