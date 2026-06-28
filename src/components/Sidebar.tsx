import { Link, useRouterState } from "@tanstack/react-router";
import { Library, Search, Settings, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import "./Sidebar.css";

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const playlistOrder = useStore((s) => s.playlistOrder);
  const playlistsMap = useStore((s) => s.playlists);
  const playlists = useMemo(
    () => playlistOrder.map((id) => playlistsMap[id]).filter(Boolean),
    [playlistOrder, playlistsMap],
  );
  const createPlaylist = useStore((s) => s.createPlaylist);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");

  const navItems = [
    { to: "/", label: "Biblioteca", icon: Library },
    { to: "/search", label: "Buscar", icon: Search },
    { to: "/settings", label: "Configurações", icon: Settings },
  ] as const;

  return (
    <aside className="sidebar-container">
      
      <nav className="nav-menu">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={`nav-link ${pathname === item.to ? "active" : ""}`}
          >
            <item.icon size={16} />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="playlist-panel">
        <div className="section-header">
          <h3 className="section-title">Playlists</h3>
          <button onClick={() => setCreating((v) => !v)} className="btn-add" title="Nova playlist">
            <Plus size={16} />
          </button>
        </div>

        {creating && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) return;
              createPlaylist(name.trim());
              setName("");
              setCreating(false);
            }}
            className="form-wrapper"
          >
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome..."
              className="input-playlist"
            />
            <button type="submit" className="btn-create">
              Criar
            </button>
          </form>
        )}

        <div className="playlist-list">
          {playlists.length === 0 && (
            <p className="no-playlist-msg">Nenhuma playlist ainda.</p>
          )}
          {playlists.map((p) => (
            <Link
              key={p.id}
              to="/playlist/$id"
              params={{ id: p.id }}
              onClick={onNavigate}
              className={`playlist-item ${pathname === `/playlist/${p.id}` ? "active" : ""}`}
            >
              {p.name}
              <span className="track-count">{p.trackIds.length}</span>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
