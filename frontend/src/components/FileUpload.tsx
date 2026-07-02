import { useState } from "react";
import { uploadFiles } from "../api/ragApi";

interface Props {
  onUploaded: (info: string) => void;
}

export default function FileUpload({ onUploaded }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (files.length === 0) return;
    setLoading(true);
    try {
      const result = await uploadFiles(files);
      onUploaded(`${result.files.length} fichier(s) indexé(s) (${result.totalStored} chunks au total)`);
      setFiles([]);
    } catch (err) {
      console.error(err);
      onUploaded("Erreur lors de l'upload");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: "1.5rem", padding: "1rem", border: "1px solid #ccc", borderRadius: "8px" }}>
      <h3>Uploader des PDF (max 5, 500 pages cumulées)</h3>
      <input
        type="file"
        accept="application/pdf"
        multiple
        onChange={(e) => setFiles(Array.from(e.target.files || []))}
      />
      <br />
      <button onClick={handleUpload} disabled={loading || files.length === 0} style={{ marginTop: "0.5rem" }}>
        {loading ? "Indexation en cours..." : "Uploader et indexer"}
      </button>
    </div>
  );
}