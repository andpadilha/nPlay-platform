import { Link } from "@tanstack/react-router";
import { ListMusic, Play } from "lucide-react";
import type { Playlist, Track } from "@/lib/youtube";
import { useStore } from "@/lib/store";
import "./PlaylistStackCard.css";

export function PlaylistStackCard({ playlist, tracks }: { playlist: Playlist; tracks: Track[] }) {
  const playQueue = useStore((s) => s.playQueue);
  const count = tracks.length;
  const cover = tracks[0]?.thumbnail;
  const ids = tracks.map((t) => t.id);

  return (
    <Link to="/playlist/$id" params={{ id: playlist.id }} className="playlist-stack-card">
      <div className="stack-container">
        <div className="stack-layer-back" />
        <div className="stack-layer-mid" />

        <div className="stack-main">
          <div className="relative-wrapper">
            {cover ? (
              <img src={cover} alt="" className="cover-image" />
            ) : (
              <div className="placeholder-cover">
                <ListMusic size={40} color="rgba(255,255,255,0.8)" />
              </div>
            )}

            <div className="badge-count">
              <ListMusic size={12} />
              {count} faixa{count === 1 ? "" : "s"}
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (ids.length) playQueue(ids, 0);
              }}
              className="play-button"
              aria-label="Tocar playlist"
            >
              <Play size={20} className="play-icon-offset" />
            </button>
          </div>

          <div className="card-info-wrapper">
            <div className="card-title">{playlist.name}</div>
            <div className="card-meta">
              Playlist • {count} faixa{count === 1 ? "" : "s"}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
