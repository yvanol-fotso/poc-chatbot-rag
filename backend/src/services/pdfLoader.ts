import fs from "fs";
import pdfParse from "pdf-parse";

function cleanExtractedText(text: string): string {
  return text
    .replace(/([a-zà-ÿ0-9])([A-ZÀ-Ÿ])/g, "$1 $2")
    // pr normalise les espaces multiples avec retours a la ligne en un seul espace
    .replace(/\s+/g, " ")
    .trim();
}

export async function extractTextFromPDF(filePath: string): Promise<string> {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  return cleanExtractedText(data.text);
}