import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import { Loader2, Menu, Search, X } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { useStore } from "@/lib/store";
import { searchYouTube, type SearchResult } from "@/lib/youtube";
import "./AppShell.css";

export function AppShell({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const apiKey = useStore((s) => s.apiKey);

  useEffect(() => {
    const p = useStore.persist.rehydrate();
    Promise.resolve(p).finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [isSidebarOpen]);

  useEffect(() => {
    const query = searchQuery.trim();

    if (!query) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    if (!apiKey) {
      setSearchResults([]);
      setShowSearchDropdown(true);
      return;
    }

    const timer = window.setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchYouTube(query, apiKey);
        setSearchResults(results.slice(0, 6));
        setShowSearchDropdown(true);
      } catch {
        setSearchResults([]);
        setShowSearchDropdown(true);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [searchQuery, apiKey]);

  const searchPlaceholder = useMemo(() => {
    if (!apiKey) return "Configure a API do YouTube para buscar";
    return "Buscar músicas no YouTube";
  }, [apiKey]);

  if (!hydrated) {
    return (
      <div className="loading-screen">
        <div className="loading-text">Carregando Norti Play…</div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="mobile-header glass">
        <div className="mobile-header-spacer" />
        <span className="mobile-brand-title">Norti Play</span>
        <button
          className="menu-toggle-btn"
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Abrir menu"
        >
          <Menu size={24} />
        </button>
      </header>

      <header className="app-topbar glass">
        <div className="app-brand">
          <div className="logo-slot">
            <img
              src="https://i.imgur.com/cSUG1IX.png"
              alt="Logo Norti Play"
              className="brand-logo"
            />
          </div>
          <div className="brand-copy">
            <span className="brand-title">Norti Play</span>
            <span className="brand-subtitle">Sua música, sem limites</span>
          </div>
        </div>

        <div className="app-search-shell">
          <label className="app-search-form">
            <Search size={18} className="app-search-icon" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onFocus={() => setShowSearchDropdown(Boolean(searchQuery.trim()))}
              onBlur={() => window.setTimeout(() => setShowSearchDropdown(false), 120)}
              placeholder={searchPlaceholder}
              className="app-search-input"
              aria-label="Buscar músicas no YouTube"
            />
            {isSearching && <Loader2 size={16} className="app-search-spinner" />}
          </label>

          {showSearchDropdown && (
            <div className="search-dropdown glass">
              {!apiKey && searchQuery.trim() ? (
                <div className="search-dropdown-empty">Configure sua chave da API para buscar vídeos.</div>
              ) : isSearching ? (
                <div className="search-dropdown-empty">Buscando...</div>
              ) : searchResults.length === 0 && searchQuery.trim() ? (
                <div className="search-dropdown-empty">Nenhum resultado encontrado.</div>
              ) : searchResults.length > 0 ? (
                searchResults.map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    className="search-result-item"
                    onMouseDown={(event) => event.preventDefault()}
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
                ))
              ) : (
                <div className="search-dropdown-empty">Digite algo para ver sugestões.</div>
              )}
            </div>
          )}
        </div>

        <div className="app-topbar-spacer" />
      </header>

      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
      )}

      <div className="app-body">
        <div className={`sidebar-wrapper ${isSidebarOpen ? "mobile-open" : ""}`}>
          <button
            className="menu-close-btn"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Fechar menu"
          >
            <X size={24} />
          </button>
          <Sidebar onNavigate={() => setIsSidebarOpen(false)} />
        </div>

        <main className="main-content">
          <div className="main-wrapper">{children}</div>
        </main>
      </div>

      <Toaster theme="dark" position="top-right" />
    </div>
  );
}
