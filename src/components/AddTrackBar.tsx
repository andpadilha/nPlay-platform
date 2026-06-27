import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  extractPlaylistId,
  extractYouTubeId,
  fetchOEmbedMeta,
  fetchYouTubePlaylist,
} from "@/lib/youtube";
import { useStore } from "@/lib/store";
import "./AddTrackBar.css";

export function AddTrackBar({ onAdded }: { onAdded?: (id: string) => void }) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const addTrack = useStore((s) => s.addTrack);
  const tracks = useStore((s) => s.tracks);
  const apiKey = useStore((s) => s.apiKey);
  const createPlaylist = useStore((s) => s.createPlaylist);
  const addToPlaylist = useStore((s) => s.addToPlaylist);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const playlistId = extractPlaylistId(value);
    const videoId = extractYouTubeId(value);

    if (!playlistId && !videoId) {
      toast.error("URL ou ID do YouTube inválido");
      return;
    }

    if (playlistId) {
      if (!apiKey) {
        if (videoId) {
          toast.warning("Playlist detectada, mas é necessária uma API Key. Adicionando apenas o vídeo.");
        } else {
          toast.error("Configure uma API Key do YouTube em Configurações.");
          return;
        }
      } else {
        setLoading(true);
        try {
          const meta = await fetchYouTubePlaylist(playlistId, apiKey);
          if (!meta.items.length) {
            toast.error("Nenhuma faixa encontrada.");
            return;
          }
          const pid = createPlaylist(meta.title);
          for (const t of meta.items) {
            if (!tracks[t.id]) addTrack(t);
            addToPlaylist(pid, t.id);
          }
          toast.success(`Playlist “${meta.title}” importada.`);
          setValue("");
          return;
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Falha ao importar");
          return;
        } finally {
          setLoading(false);
        }
      }
    }

    if (!videoId) return;
    if (tracks[videoId]) {
      toast.info("Essa faixa já está na biblioteca");
      onAdded?.(videoId);
      setValue("");
      return;
    }

    setLoading(true);
    try {
      const meta = await fetchOEmbedMeta(videoId);
      addTrack({
        id: videoId,
        title: meta.title || `Vídeo ${videoId}`,
        author: meta.author || "Desconhecido",
        thumbnail: meta.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        addedAt: Date.now(),
      });
      toast.success("Adicionado à biblioteca");
      onAdded?.(videoId);
      setValue("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="add-track-bar glass">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Cole uma URL do YouTube (vídeo ou playlist) ou um ID…"
        className="input-url"
      />
      <button type="submit" disabled={loading || !value.trim()} className="btn-add-track">
        {loading ? <Loader2 className="spin" size={16} /> : <Plus size={16} />}
        Adicionar
      </button>
    </form>
  );
}
