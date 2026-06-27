import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import { Menu, X } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { useStore } from "@/lib/store";
import "./AppShell.css";

export function AppShell({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
      )}

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

      <Toaster theme="dark" position="top-right" />
    </div>
  );
}
