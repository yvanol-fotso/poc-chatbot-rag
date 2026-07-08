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

  // Permet de forcer Sidebar à recharger la liste des conversations
  const [refreshKey, setRefreshKey] = useState(0);


  const handleNewSession = () => {
    const newSession = makeSessionId();

    setSessionId(newSession);
    setDocuments([]);

    // recharge la liste des conversations
    setRefreshKey((v) => v + 1);
  };


  const handleSelectSession = (selectedSessionId: string) => {
    setSessionId(selectedSessionId);
    setDocuments([]);

    // her plus tard on pourras charger les documents
    // et messages de cette session depuis PostgreSQL
  };


  const handleDocumentsIndexed = (newDocs: DocumentEntry[]) => {
    setDocuments((prev) => [...prev, ...newDocs]);

    // actualise les conversations apres upload
    setRefreshKey((v) => v + 1);
  };


  const handleRemoveDocument = (filename: string) => {
    setDocuments((prev) =>
      prev.filter((d) => d.filename !== filename)
    );
  };


  return (
    <div className="app">

      <Sidebar
        documents={documents}
        isOpen={sidebarOpen}
        activeSessionId={sessionId}
        onToggle={() => setSidebarOpen((v) => !v)}
        onNewSession={handleNewSession}
        onRemoveDocument={handleRemoveDocument}
        onSelectSession={handleSelectSession}
        refreshKey={refreshKey}
      />


      <main className="main">

        {!sidebarOpen && (
          <button
            className="icon-button main__open-sidebar"
            onClick={() => setSidebarOpen(true)}
            aria-label="Afficher la barre laterale"
          >
            <MenuIcon />
          </button>
        )}


        <ChatBox
          key={sessionId}
          sessionId={sessionId}
          onDocumentsIndexed={handleDocumentsIndexed}
        />

      </main>

    </div>
  );
}