import { useState } from "react";
import "./App.css";
import ChatBox from "./components/ChatBox";
import Sidebar from "./components/Sidebar";
import type { DocumentEntry } from "./components/Sidebar";
import { MenuIcon } from "./components/Icons";

function makeSessionId() {
  return `session-${Date.now()}`;
}

export default function App() {
  const [sessionId, setSessionId] = useState(makeSessionId);
  const [documents, setDocuments] = useState<DocumentEntry[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleNewSession = () => {
    setSessionId(makeSessionId());
    setDocuments([]);
  };

  const handleDocumentsIndexed = (newDocs: DocumentEntry[]) => {
    setDocuments((prev) => [...prev, ...newDocs]);
  };

  const handleRemoveDocument = (filename: string) => {
    setDocuments((prev) => prev.filter((d) => d.filename !== filename));
  };

  return (
    <div className="app">
      <Sidebar
        documents={documents}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
        onNewSession={handleNewSession}
        onRemoveDocument={handleRemoveDocument}
      />

      <main className="main">
        {!sidebarOpen && (
          <button className="icon-button main__open-sidebar" onClick={() => setSidebarOpen(true)} aria-label="Afficher la barre laterale">
            <MenuIcon />
          </button>
        )}

        <ChatBox key={sessionId} sessionId={sessionId} onDocumentsIndexed={handleDocumentsIndexed} />
      </main>
    </div>
  );
}