import { Queue } from "bullmq";
import { connection } from "./redis";

export interface GraphIngestionJobData {
  jobId: number;       // id dans la table indexing_jobs, pour le suivi
  sessionId: string;
  filename: string;
  chunks: { content: string }[];
}

export const graphQueue = new Queue<GraphIngestionJobData>("graph-ingestion", {
  connection,
  defaultJobOptions: {
    attempts: 1, // le retry par chunk sera géré à l'étape 3, pas ici au niveau du job entier
    removeOnComplete: { age: 3600 }, // garde 1h d'historique puis nettoie
    removeOnFail: { age: 86400 },     // garde 24h les échecs pour debug
  },
});

export async function enqueueGraphIngestion(data: GraphIngestionJobData) {
  await graphQueue.add("ingest-document", data);
}