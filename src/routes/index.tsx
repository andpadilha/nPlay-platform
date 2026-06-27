import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { AddTrackBar } from "@/components/AddTrackBar";
import { TrackCard } from "@/components/TrackCard";
import { PlaylistStackCard } from "@/components/PlaylistStackCard";
import "@/styles/page.css";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Biblioteca — Norti Play" },
      { name: "description", content: "Sua biblioteca pessoal de músicas no Norti Play." },
    ],
  }),
  component: LibraryPage,
});

function LibraryPage() {
  const trackOrder = useStore((s) => s.trackOrder);
  const tracksMap = useStore((s) => s.tracks);
  const playlistOrder = useStore((s) => s.playlistOrder);
  const playlistsMap = useStore((s) => s.playlists);

  const tracks = useMemo(
    () => trackOrder.map((id) => tracksMap[id]).filter(Boolean),
    [trackOrder, tracksMap],
  );
  const playlists = useMemo(
    () => playlistOrder.map((id) => playlistsMap[id]).filter(Boolean),
    [playlistOrder, playlistsMap],
  );

  const trackIds = tracks.map((t) => t.id);

  return (
    <motion.div
      className="page"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <header className="page-header">
        <h1 className="page-title">Biblioteca</h1>
        <p className="page-subtitle">Sua coleção pessoal de faixas e playlists.</p>
      </header>

      <AddTrackBar />

      {playlists.length > 0 && (
        <section className="page-section">
          <div className="section-row">
            <h2 className="section-h2">Playlists</h2>
            <span className="section-meta">{playlists.length}</span>
          </div>
          <div className="grid grid-playlists">
            {playlists.map((p) => (
              <PlaylistStackCard
                key={p.id}
                playlist={p}
                tracks={p.trackIds.map((id) => tracksMap[id]).filter(Boolean)}
              />
            ))}
          </div>
        </section>
      )}

      <section className="page-section">
        <div className="section-row">
          <h2 className="section-h2">Faixas salvas</h2>
          <span className="section-meta">{tracks.length}</span>
        </div>
        {tracks.length === 0 ? (
          <div className="empty-state glass">
            <h3>Nada por aqui ainda</h3>
            <p>Cole uma URL do YouTube acima para adicionar sua primeira faixa.</p>
          </div>
        ) : (
          <motion.div
            className="grid grid-tracks"
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.04 } },
            }}
          >
            {tracks.map((t) => (
              <motion.div
                key={t.id}
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  show: { opacity: 1, y: 0 },
                }}
              >
                <TrackCard track={t} contextIds={trackIds} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>
    </motion.div>
  );
}
