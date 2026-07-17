import neo4j, { Driver, Session } from "neo4j-driver";
import { ExtractionResult } from "./graphExtraction";

let driver: Driver | null = null;

function getDriver(): Driver {
  if (!driver) {
    driver = neo4j.driver(
      process.env.NEO4J_URI ?? "bolt://localhost:7687",
      neo4j.auth.basic(
        process.env.NEO4J_USER ?? "neo4j",
        process.env.NEO4J_PASSWORD ?? ""
      )
    );
  }
  return driver;
}

export async function closeGraphDriver() {
  if (driver) {
    await driver.close();
    driver = null;
  }
}

/**
 * Insère les entités et relations extraites d'un chunk dans le graphe,
 * scopées par sessionId (comme pour Chroma/Qdrant) et rattachées au document source.
 */
export async function ingestExtraction(
  extraction: ExtractionResult,
  sessionId: string,
  filename: string
) {
  if (extraction.entities.length === 0) return;

  const session: Session = getDriver().session();
  try {
    await session.executeWrite(async (tx) => {
      // upsert des entités
      for (const entity of extraction.entities) {
        await tx.run(
          `MERGE (e:Entity { name: $name, sessionId: $sessionId })
           ON CREATE SET e.type = $type, e.sources = [$filename]
           ON MATCH SET e.sources = CASE
             WHEN NOT $filename IN e.sources THEN e.sources + $filename
             ELSE e.sources
           END`,
          { name: entity.name, type: entity.type, sessionId, filename }
        );
      }

      // upsert des relations
      for (const rel of extraction.relations) {
        const relType = rel.relation.replace(/[^A-Z0-9_]/gi, "_").toUpperCase();
        await tx.run(
          `MERGE (a:Entity { name: $source, sessionId: $sessionId })
           MERGE (b:Entity { name: $target, sessionId: $sessionId })
           MERGE (a)-[r:${relType}]->(b)`,
          { source: rel.source, target: rel.target, sessionId }
        );
      }
    });
  } finally {
    await session.close();
  }
}

export interface GraphMatch {
  entity: string;
  type: string;
  relatedFacts: string[]; // phrases reconstituées "A RELATION B"
  sources: string[];
}

/**
 * Recherche dans le graphe les entités correspondant aux noms fournis,
 * et remonte leurs relations directes (1 saut) pour construire le contexte.
 */
export async function queryGraph(
  entityNames: string[],
  sessionId: string
): Promise<GraphMatch[]> {
  if (entityNames.length === 0) return [];

  const session: Session = getDriver().session();
  try {
    const result = await session.executeRead((tx) =>
      tx.run(
        `MATCH (e:Entity { sessionId: $sessionId })
         WHERE toLower(e.name) IN $names
         OPTIONAL MATCH (e)-[r]-(related:Entity { sessionId: $sessionId })
         RETURN e.name AS name, e.type AS type, e.sources AS sources,
                collect(DISTINCT { relType: type(r), relatedName: related.name }) AS relations`,
        { sessionId, names: entityNames.map((n) => n.toLowerCase()) }
      )
    );

    return result.records.map((record) => {
      const relations = record.get("relations") as {
        relType: string | null;
        relatedName: string | null;
      }[];

      const relatedFacts = relations
        .filter((r) => r.relType && r.relatedName)
        .map((r) => `${record.get("name")} ${r.relType} ${r.relatedName}`);

      return {
        entity: record.get("name"),
        type: record.get("type"),
        relatedFacts,
        sources: record.get("sources") ?? [],
      };
    });
  } finally {
    await session.close();
  }
}