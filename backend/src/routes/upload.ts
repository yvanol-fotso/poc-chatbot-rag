import { Router } from "express";
import multer from "multer";
import path from "path";
import { extractTextFromPDF } from "../services/pdfLoader";
import { chunkText } from "../services/chunker";
import { embedText } from "../services/embeddings";
import { addToStore, getStoreSize } from "../services/vectorStore";
import pdfParse from "pdf-parse";
import fs from "fs";

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../uploads"));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

const MAX_FILES = 5;
const MAX_TOTAL_PAGES = 500;

router.post("/upload", upload.array("files", MAX_FILES), async (req, res) => {
  const files = req.files as Express.Multer.File[];

  if (!files || files.length === 0) {
    return res.status(400).json({ error: "Aucun fichier reçu" });
  }

  try {
    // 1. Vérifier le nombre total de pages AVANT de tout traiter
    let totalPages = 0;
    const pageCounts: { filename: string; pages: number }[] = [];

    for (const file of files) {
      const dataBuffer = fs.readFileSync(file.path);
      const data = await pdfParse(dataBuffer);
      totalPages += data.numpages;
      pageCounts.push({ filename: file.filename, pages: data.numpages });
    }

    if (totalPages > MAX_TOTAL_PAGES) {
      return res.status(400).json({
        error: `Limite dépassée : ${totalPages} pages au total (max ${MAX_TOTAL_PAGES})`,
        details: pageCounts,
      });
    }

    // 2. Traiter chaque fichier : extraction → chunking → embeddings → stockage
    const results = [];

    for (const file of files) {
      const text = await extractTextFromPDF(file.path);
      const chunks = chunkText(text);

      console.log(`Génération des embeddings pour ${file.filename} (${chunks.length} chunks)...`);

      const chunksWithEmbeddings = [];
      for (const chunk of chunks) {
        const embedding = await embedText(chunk.content);
        chunksWithEmbeddings.push({
          ...chunk,
          embedding,
          filename: file.filename,
        });
      }

      await addToStore(chunksWithEmbeddings);

      results.push({
        filename: file.filename,
        totalChunks: chunks.length,
      });
    }

    res.json({
      message: `${files.length} fichier(s) traité(s) et indexé(s) avec succès`,
      totalPages,
      files: results,
      totalStored: await getStoreSize(),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors du traitement des fichiers" });
  }
});

export default router;