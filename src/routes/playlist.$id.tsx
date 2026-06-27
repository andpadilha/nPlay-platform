import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Play, Shuffle, Trash2, Pencil, Check, X, ListMusic } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import "@/styles/page.css";
import "@/styles/playlist.css";

export const Route = createFileRoute("/playlist/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Playlist — Norti Play` },
      { name: "description", content: `Detalhes da playlist ${params.id} no Norti Play.` },
    ],
  }),
  component: PlaylistPage,
});

function PlaylistPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  const playlist = useStore((s) => s.playlists[id]);
  const tracksMap = useStore((s) => s.tracks);
  const playQueue = useStore((s) => s.playQueue);
  const reorder = useStore((s) => s.reorderPlaylist);
  const rename = useStore((s) => s.renamePlaylist);
  const remove = useStore((s) => s.deletePlaylist);
  const removeFromPlaylist = useStore((s) => s.removeFromPlaylist);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(playlist?.name ?? "");

  const tracks = useMemo(
    () => (playlist ? playlist.trackIds.map((tid) => tracksMap[tid]).filter(Boolean) : []),
    [playlist, tracksMap],
  );

  if (!playlist) {
    return (
      <div className="page">
        <div className="empty-state glass">
          <h3>Playlist não encontrada</h3>
          <p>Ela pode ter sido removida.</p>
        </div>
      </div>
    );
  }

  const cover = tracks[0]?.thumbnail;

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = playlist.trackIds;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    // arrayMove computed inside store via indexes
    reorder(playlist.id, from, to);
  };

  return (
    <motion.div
      className="page"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="playlist-hero glass">
        <div className="playlist-cover">
          {cover ? (
            <img src={cover} alt="" />
          ) : (
            <div className="playlist-cover-placeholder">
              <ListMusic size={48} />
            </div>
          )}
        </div>
        <div className="playlist-hero-info">
          <span className="playlist-kind">Playlist</span>
          {editing ? (
            <form
              className="playlist-name-edit"
              onSubmit={(e) => {
                e.preventDefault();
                if (name.trim()) {
                  rename(playlist.id, name.trim());
                  setEditing(false);
                }
              }}
            >
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="playlist-name-input"
                autoFocus
              />
              <button type="submit" className="icon-btn">
                <Check size={18} />
              </button>
              <button
                type="button"
                className="icon-btn"
                onClick={() => {
                  setEditing(false);
                  setName(playlist.name);
                }}
              >
                <X size={18} />
              </button>
            </form>
          ) : (
            <h1 className="playlist-title">{playlist.name}</h1>
          )}
          <p className="playlist-meta">
            {tracks.length} faixa{tracks.length === 1 ? "" : "s"}
          </p>

          <div className="playlist-actions">
            <button
              className="btn-primary"
              disabled={!tracks.length}
              onClick={() => playQueue(playlist.trackIds, 0)}
            >
              <Play size={16} /> Tocar tudo
            </button>
            <button
              className="btn-ghost"
              disabled={!tracks.length}
              onClick={() => {
                const ids = [...playlist.trackIds];
                for (let i = ids.length - 1; i > 0; i--) {
                  const j = Math.floor(Math.random() * (i + 1));
                  [ids[i], ids[j]] = [ids[j], ids[i]];
                }
                playQueue(ids, 0);
              }}
            >
              <Shuffle size={16} /> Embaralhar
            </button>
            {!editing && (
              <button className="btn-ghost" onClick={() => setEditing(true)}>
                <Pencil size={16} /> Renomear
              </button>
            )}
            <button
              className="btn-ghost destructive"
              onClick={() => {
                if (confirm(`Excluir a playlist “${playlist.name}”?`)) {
                  remove(playlist.id);
                  toast.success("Playlist excluída");
                  navigate({ to: "/" });
                }
              }}
            >
              <Trash2 size={16} /> Excluir
            </button>
          </div>
        </div>
      </div>

      {tracks.length === 0 ? (
        <div className="empty-state glass">
          <h3>Playlist vazia</h3>
          <p>Adicione faixas a partir da sua biblioteca.</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={playlist.trackIds} strategy={verticalListSortingStrategy}>
            <ol className="track-list glass">
              {tracks.map((t, i) => (
                <SortableRow
                  key={t.id}
                  id={t.id}
                  index={i}
                  title={t.title}
                  author={t.author}
                  thumbnail={t.thumbnail}
                  onPlay={() => playQueue(playlist.trackIds, i)}
                  onRemove={() => removeFromPlaylist(playlist.id, t.id)}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      )}
    </motion.div>
  );

  // arrayMove unused but kept to silence import (used implicitly by sortable)
  void arrayMove;
}

function SortableRow({
  id,
  index,
  title,
  author,
  thumbnail,
  onPlay,
  onRemove,
}: {
  id: string;
  index: number;
  title: string;
  author: string;
  thumbnail: string;
  onPlay: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <li ref={setNodeRef} style={style} className="track-row">
      <button className="row-handle" {...attributes} {...listeners} aria-label="Reordenar">
        <GripVertical size={16} />
      </button>
      <span className="row-index">{index + 1}</span>
      <img src={thumbnail} alt="" className="row-thumb" />
      <div className="row-info">
        <div className="row-title">{title}</div>
        <div className="row-author">{author}</div>
      </div>
      <button className="row-play" onClick={onPlay} aria-label="Tocar">
        <Play size={16} />
      </button>
      <button className="row-remove" onClick={onRemove} aria-label="Remover">
        <Trash2 size={16} />
      </button>
    </li>
  );
}
