import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { Search as SearchIcon, Plus, Loader2, Play } from "lucide-react";
import { toast } from "sonner";
import { searchYouTube, fetchOEmbedMeta, type SearchResult } from "@/lib/youtube";
import { useStore } from "@/lib/store";
import "@/styles/page.css";
import "@/styles/search.css";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Norti Play - Buscar" },
      { name: "description", content: "Busque vídeos no YouTube e adicione à sua biblioteca." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const apiKey = useStore((s) => s.apiKey);
  const addTrack = useStore((s) => s.addTrack);
  const playTrack = useStore((s) => s.playTrack);
  const tracks = useStore((s) => s.tracks);

  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    if (!apiKey) {
      toast.error("Configure sua chave da API em Configurações.");
      return;
    }
    setLoading(true);
    try {
      const r = await searchYouTube(q.trim(), apiKey);
      setResults(r);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha na busca");
    } finally {
      setLoading(false);
    }
  };

  const addAndPlay = async (r: SearchResult, autoplay = false) => {
    if (!tracks[r.id]) {
      const meta = await fetchOEmbedMeta(r.id).catch(() => null);
      addTrack({
        id: r.id,
        title: meta?.title || r.title,
        author: meta?.author || r.author,
        thumbnail: meta?.thumbnail || r.thumbnail,
        addedAt: Date.now(),
      });
      toast.success("Adicionado à biblioteca");
    } else {
      toast.info("Já está na biblioteca");
    }
    if (autoplay) playTrack(r.id);
  };

  return (
    <motion.div
      className="page"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <header className="page-header">
        <h1 className="page-title">Buscar</h1>
        <p className="page-subtitle">Encontre faixas no YouTube e adicione à sua biblioteca.</p>
      </header>

      <form onSubmit={onSubmit} className="search-bar glass">
        <SearchIcon size={18} color="rgba(255,255,255,0.6)" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="O que você quer ouvir?"
          className="search-input"
        />
        <button type="submit" disabled={loading || !q.trim()} className="search-button">
          {loading ? <Loader2 className="spin" size={16} /> : "Buscar"}
        </button>
      </form>

      {!apiKey && (
        <div className="empty-state glass">
          <h3>Configure sua chave para pesquisar</h3>
          <p>
            A busca usa a YouTube Data API v3. Adicione sua chave em{" "}
            <Link to="/settings" className="inline-link">
              Configurações
            </Link>
            . Adicionar por URL continua funcionando normalmente.
          </p>
        </div>
      )}

      {apiKey && results.length === 0 && !loading && (
        <div className="empty-state glass">
          <h3>Faça uma busca</h3>
          <p>Digite o nome de uma música, artista ou álbum acima.</p>
        </div>
      )}

      <div className="grid grid-tracks">
        {results.map((r) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="search-card glass"
          >
            <div className="search-thumb-wrap">
              <img src={r.thumbnail} alt="" className="search-thumb" />
              <button onClick={() => addAndPlay(r, true)} className="search-play" aria-label="Tocar agora">
                <Play size={18} />
              </button>
            </div>
            <div className="search-info">
              <div className="search-title">{r.title}</div>
              <div className="search-author">{r.author}</div>
            </div>
            <button onClick={() => addAndPlay(r, false)} className="search-add" aria-label="Adicionar">
              <Plus size={16} />
              Adicionar
            </button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
