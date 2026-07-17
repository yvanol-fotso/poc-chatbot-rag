import IORedis from "ioredis";

export const connection = new IORedis(
  process.env.REDIS_URL ?? "redis://localhost:6379",
  {
    maxRetriesPerRequest: null, // requis par BullMQ
  }
);

connection.on("error", (err) => {
  console.error("Erreur de connexion Redis :", err.message);
});