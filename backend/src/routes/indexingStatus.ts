import { Router } from "express";
import { getJobsForSession } from "../services/jobStore";

const router = Router();

router.get("/indexing-status/:sessionId", async (req, res) => {
  const { sessionId } = req.params;
  try {
    const jobs = await getJobsForSession(sessionId);
    res.json({ jobs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la récupération du statut d'indexation" });
  }
});

export default router;