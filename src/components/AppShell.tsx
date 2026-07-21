import { Link, useRouterState } from "@tanstack/react-router";
import { Library, Search, Settings, ListMusic, Plus, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Toaster, toast } from "sonner";
import { Sidebar } from "./Sidebar";
import { useStore } from "@/lib/store";
import { fetchOEmbedMeta, searchYouTube, getYouTubeSuggestions, type SearchResult } from "@/lib/youtube";
import "./AppShell.css";
import { Logo } from "./Logo";

const searchCache = new Map<string, SearchResult[]>();

export function AppShell({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // Obtém o caminho atual diretamente do TanStack Router
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const apiKey = useStore((s) => s.apiKey);
  const addTrack = useStore((s) => s.addTrack);
  const playTrack = useStore((s) => s.playTrack);
  const tracks = useStore((s) => s.tracks);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 768px)");
    setIsMobile(media.matches);

    const onChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };

    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const p = useStore.persist.rehydrate();
    Promise.resolve(p).finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    const query = searchQuery.trim();

    if (query.length < 3) {
      setSearchResults([]);
      setSuggestions([]);
      setShowSearchDropdown(false);
      return;
    }

    const controller = new AbortController();

    const timer = window.setTimeout(async () => {
      setIsSearching(true);

      try {
        const cached = searchCache.get(query);
        if (cached) {
          setSearchResults(cached);
          setShowSearchDropdown(true);
          setIsSearching(false);
          return;
        }

        const suggestList = await getYouTubeSuggestions(query);
        setSuggestions(suggestList);

        const results = await searchYouTube(query, apiKey);
        const limited = results.slice(0, 10);

        searchCache.set(query, limited);

        setSearchResults(limited);
        setShowSearchDropdown(true);
      } catch (err) {
        if (controller.signal.aborted) return;
        setSearchResults([]);
        setShowSearchDropdown(true);
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, 900);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery, apiKey]);

  const searchPlaceholder = useMemo(() => {
    if (!apiKey) return "Configure a API do YouTube para buscar";
    return "Buscar músicas no YouTube";
  }, [apiKey]);

  const handleAddSuggestion = async (result: SearchResult) => {
    if (!tracks[result.id]) {
      const meta = await fetchOEmbedMeta(result.id).catch(() => null);
      addTrack({
        id: result.id,
        title: meta?.title || result.title,
        author: meta?.author || result.author,
        thumbnail: meta?.thumbnail || result.thumbnail,
        addedAt: Date.now(),
      });
      toast.success("Adicionado à biblioteca");
    } else {
      toast.info("Já está na biblioteca");
    }

    playTrack(result.id);
    setShowSearchDropdown(false);
  };

  if (!hydrated) {
    return (
      <div className="loading-screen">
        <div className="loading-text">Carregando Norti Play…</div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className={`glass ${isMobile ? "mobile-header" : "app-topbar"}`}>
        {isMobile ? (
          <div className="mobile-header-brand">
            <Logo className="logo-mobile" />
            <span className="mobile-brand-title">Norti Play</span>
          </div>
        ) : (
          <>
            <div className="app-brand">
              <div className="logo-slot">
                <Logo className="brand-logo-svg" />
              </div>

              <div className="brand-copy">
                <span className="brand-title">Norti Play</span>
                <span className="brand-subtitle">
                  Sua música, sem limites
                </span>
              </div>
            </div>

            <div className="app-search-shell">
              <label className="app-search-form">
                <Search size={18} className="app-search-icon" />

                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onFocus={() =>
                    setShowSearchDropdown(Boolean(searchQuery.trim()))
                  }
                  onBlur={() =>
                    window.setTimeout(() => setShowSearchDropdown(false), 120)
                  }
                  placeholder={searchPlaceholder}
                  className="app-search-input"
                  aria-label="Buscar músicas no YouTube"
                />

                {isSearching && (
                  <Loader2 size={16} className="app-search-spinner" />
                )}
              </label>

              {showSearchDropdown && (
                <div className="search-dropdown glass">
                  {!apiKey && searchQuery.trim() ? (
                    <div className="search-dropdown-empty">Configure sua chave da API.</div>
                  ) : isSearching ? (
                    <div className="search-dropdown-empty">Buscando...</div>
                  ) : (
                    <>
                      {suggestions.length > 0 && (
                        <div className="search-suggestions-list">
                          <div className="suggestion-header">Sugestões:</div>
                          {suggestions.map((suggestion) => (
                            <button
                              key={suggestion}
                              className="suggestion-item"
                              onClick={() => setSearchQuery(suggestion)}
                            >
                              <Search size={14} /> {suggestion}
                            </button>
                          ))}
                        </div>
                      )}

                      {searchResults.length > 0 ? (
                        searchResults.map((result) => (
                          <div key={result.id} className="search-result-item">
                            <button
                              type="button"
                              className="search-result-main"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setSearchQuery(result.title);
                                setShowSearchDropdown(false);
                              }}
                            >
                              <img src={result.thumbnail} alt="" className="search-result-thumb" />
                              <span className="search-result-texts">
                                <span className="search-result-title">{result.title}</span>
                                <span className="search-result-author">{result.author}</span>
                              </span>
                            </button>
                            <button
                              type="button"
                              className="search-result-action"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                void handleAddSuggestion(result);
                              }}
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        ))
                      ) : searchQuery.trim().length >= 3 ? (
                        <div className="search-dropdown-empty">Nenhum vídeo encontrado.</div>
                      ) : null}
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="app-topbar-spacer" />
          </>
        )}
      </header>

      <div className="app-body">
        {!isMobile && (
          <div className="sidebar-wrapper">
            <Sidebar />
          </div>
        )}

        <main className="main-content">
          <div className="main-wrapper">{children}</div>
        </main>
      </div>

      {/* Footer Mobile com links do TanStack Router */}
      {isMobile && (
        <nav className="mobile-bottom-nav glass">
          <Link
            to="/"
            className={`bottom-nav-item ${pathname === "/" ? "active" : ""}`}
          >
            <Library size={20} />
            <span>Biblioteca</span>
          </Link>

          <Link
            to="/search"
            className={`bottom-nav-item ${pathname === "/search" ? "active" : ""}`}
          >
            <Search size={20} />
            <span>Buscar</span>
          </Link>

          <Link
            to="/settings"
            className={`bottom-nav-item ${pathname === "/settings" ? "active" : ""}`}
          >
            <Settings size={20} />
            <span>Ajustes</span>
          </Link>
        </nav>
      )}

      <Toaster theme="dark" position="top-right" />
    </div>
  );
}