import { Worker, Job } from "bullmq";
import { connection } from "./redis";
import { GraphIngestionJobData } from "./graphQueue";
import { extractEntitiesAndRelations } from "../services/rag/graphExtraction";
import { ingestExtraction } from "../services/rag/graphStore";
import {
  markProcessing,
  incrementProgress,
  markCompleted,
  markFailed,
} from "../services/jobStore";

export function startGraphWorker() {
  const worker = new Worker<GraphIngestionJobData>(
    "graph-ingestion",
    async (job: Job<GraphIngestionJobData>) => {
      const { jobId, sessionId, filename, chunks } = job.data;

      await markProcessing(jobId);
      console.log(`[graph-worker] Début indexation graphe : ${filename} (${chunks.length} chunks)`);

      for (const chunk of chunks) {
        try {
          const extraction = await extractEntitiesAndRelations(chunk.content);
          await ingestExtraction(extraction, sessionId, filename);
          await incrementProgress(jobId, false);
        } catch (error) {
          console.error(`[graph-worker] Échec sur un chunk de ${filename} :`, error);
          await incrementProgress(jobId, true);
        }
      }

      await markCompleted(jobId);
      console.log(`[graph-worker] Indexation graphe terminée : ${filename}`);
    },
    {
      connection,
      concurrency: 1, // un document à la fois pour l'instant ; on ajustera au rate limiting (étape 2)
    }
  );

  worker.on("failed", async (job, err) => {
    if (job) {
      await markFailed(job.data.jobId, err.message);
      console.error(`[graph-worker] Job échoué pour ${job.data.filename} :`, err.message);
    }
  });

  console.log("[graph-worker] Worker d'indexation graphe démarré");
  return worker;
}