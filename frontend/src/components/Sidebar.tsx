import { FileIcon, MenuIcon, NewChatIcon, TrashIcon } from "./Icons";

export interface DocumentEntry {
  filename: string;
  chunks: number;
}

interface SidebarProps {
  documents: DocumentEntry[];
  isOpen: boolean;
  onToggle: () => void;
  onNewSession: () => void;
  onRemoveDocument: (filename: string) => void;
}

export default function Sidebar({ documents, isOpen, onToggle, onNewSession, onRemoveDocument }: SidebarProps) {
  return (
    <>
      {isOpen && <div className="sidebar-scrim" onClick={onToggle} />}

      <aside className={`sidebar ${isOpen ? "sidebar--open" : "sidebar--collapsed"}`}>
        <div className="sidebar__header">
          <span className="sidebar__title">Assistant documentaire</span>
          <button className="icon-button sidebar__collapse" onClick={onToggle} aria-label="Masquer la barre laterale">
            <MenuIcon />
          </button>
        </div>

        <button className="sidebar__new-session" onClick={onNewSession}>
          <NewChatIcon />
          Nouvelle conversation
        </button>

        <div className="sidebar__section-label">Documents indexes</div>

        <div className="sidebar__documents">
          {documents.length === 0 && (
            <p className="sidebar__empty">
              Aucun document pour l'instant. Ajoutez un PDF depuis la zone de saisie.
            </p>
          )}

          {documents.map((doc) => (
            <div className="document-item" key={doc.filename}>
              <FileIcon />
              <div className="document-item__info">
                <span className="document-item__name" title={doc.filename}>
                  {doc.filename}
                </span>
                <span className="document-item__meta">{doc.chunks} extraits</span>
              </div>
              <button
                className="icon-button document-item__remove"
                onClick={() => onRemoveDocument(doc.filename)}
                aria-label={`Retirer ${doc.filename}`}
              >
                <TrashIcon />
              </button>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}