import { Play, Plus, Trash2, MoreVertical } from "lucide-react";
import { useMemo, useState } from "react";
import type { Track } from "@/lib/youtube";
import { useStore, currentTrack } from "@/lib/store";
import "./TrackCard.css";

export function TrackCard({
  track,
  contextIds,
  onRemove,
}: {
  track: Track;
  contextIds?: string[];
  onRemove?: () => void;
}) {
  const playTrack = useStore((s) => s.playTrack);
  const current = useStore(currentTrack);
  const playing = useStore((s) => s.isPlaying);
  const isActive = current?.id === track.id;
  const [menu, setMenu] = useState(false);

  return (
    <div className={`track-card ${menu ? "menu-open" : ""} ${isActive ? "active" : ""}`}>
      <div className="thumbnail-wrapper">
        <img src={track.thumbnail} alt="" className="track-thumbnail" />
        <button onClick={() => playTrack(track.id, contextIds)} className="play-btn" aria-label="Tocar">
          <Play size={20} />
        </button>
        {isActive && <div className="status-badge">{playing ? "Tocando" : "Pausada"}</div>}
      </div>

      <div className="track-info-container">
        <div className="track-text-wrapper">
          <div className="track-title">{track.title}</div>
          <div className="track-author">{track.author}</div>
        </div>

        <div className="menu-trigger-wrapper">
          <button onClick={() => setMenu((v) => !v)} className="menu-btn" aria-label="Menu">
            <MoreVertical size={16} />
          </button>
          {menu && (
            <>
              <div className="menu-backdrop" onClick={() => setMenu(false)} />
              <PlaylistMenu trackId={track.id} onClose={() => setMenu(false)} onRemove={onRemove} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PlaylistMenu({
  trackId,
  onClose,
  onRemove,
}: {
  trackId: string;
  onClose: () => void;
  onRemove?: () => void;
}) {
  const playlistOrder = useStore((s) => s.playlistOrder);
  const playlistsMap = useStore((s) => s.playlists);
  const playlists = useMemo(
    () => playlistOrder.map((id) => playlistsMap[id]).filter(Boolean),
    [playlistOrder, playlistsMap],
  );
  const addToPlaylist = useStore((s) => s.addToPlaylist);
  const removeTrack = useStore((s) => s.removeTrack);

  return (
    <div className="playlist-menu">
      <div className="menu-header">Adicionar à playlist</div>
      {playlists.length === 0 && <div className="menu-empty">Crie uma playlist primeiro</div>}
      {playlists.map((p) => (
        <button
          key={p.id}
          onClick={() => {
            addToPlaylist(p.id, trackId);
            onClose();
          }}
          className="menu-item"
        >
          <Plus size={14} />
          {p.name}
        </button>
      ))}
      <div className="menu-divider" />
      <button
        onClick={() => {
          onRemove ? onRemove() : removeTrack(trackId);
          onClose();
        }}
        className="menu-item destructive"
      >
        <Trash2 size={14} />
        {onRemove ? "Remover desta playlist" : "Remover da biblioteca"}
      </button>
    </div>
  );
}
