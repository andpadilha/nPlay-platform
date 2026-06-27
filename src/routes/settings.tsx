import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Download, Upload, Trash2, KeyRound, Save, EyeOff, Eye } from "lucide-react";
import { useStore } from "@/lib/store";
import { YOUTUBE_API_KEY } from "@/config/youtube";
import "@/styles/page.css";
import "@/styles/settings.css";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Configurações — Norti Play" },
      { name: "description", content: "Gerencie sua chave de API, dados e preferências do Norti Play." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const apiKey = useStore((s) => s.apiKey);
  const setApiKey = useStore((s) => s.setApiKey);
  const clearApiKey = useStore((s) => s.clearApiKey);
  const clearAllData = useStore((s) => s.clearAllData);
  const exportData = useStore((s) => s.exportData);
  const importData = useStore((s) => s.importData);

  const [draft, setDraft] = useState(apiKey);
  const [show, setShow] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const save = () => {
    setApiKey(draft.trim());
    toast.success("Chave salva");
  };

  const onExport = () => {
    const blob = new Blob([exportData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nortiplay-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImport = async (file: File) => {
    try {
      const text = await file.text();
      importData(text);
      toast.success("Dados importados");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao importar");
    }
  };

  return (
    <motion.div
      className="page"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <header className="page-header">
        <h1 className="page-title">Configurações</h1>
        <p className="page-subtitle">Personalize o Norti Play e gerencie seus dados.</p>
      </header>

      <section className="settings-card glass">
        <div className="settings-card-header">
          <div className="settings-icon">
            <KeyRound size={18} />
          </div>
          <div>
            <h2 className="settings-h2">YouTube API Key</h2>
            <p className="settings-help">
              Necessária para buscar por palavras-chave. Adicionar por URL funciona sem chave.
            </p>
          </div>
        </div>

        <div className="settings-row">
          <div className="input-with-action">
            <input
              type={show ? "text" : "password"}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Cole sua chave da API v3 aqui"
              className="settings-input"
            />
            <button className="icon-btn" onClick={() => setShow((v) => !v)} aria-label="Mostrar/ocultar">
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <button className="btn-primary" onClick={save}>
            <Save size={16} /> Salvar
          </button>
          <button
            className="btn-ghost destructive"
            onClick={() => {
              clearApiKey();
              setDraft("");
              toast.success("Chave removida");
            }}
          >
            <Trash2 size={16} /> Remover
          </button>
        </div>

        {YOUTUBE_API_KEY && !apiKey && (
          <p className="settings-note">
            Existe uma chave padrão definida no código, mas foi removida nesta sessão.
          </p>
        )}
      </section>

      <section className="settings-card glass">
        <div className="settings-card-header">
          <div className="settings-icon">
            <Download size={18} />
          </div>
          <div>
            <h2 className="settings-h2">Dados</h2>
            <p className="settings-help">Exporte sua biblioteca para backup ou importe um JSON existente.</p>
          </div>
        </div>

        <div className="settings-row">
          <button className="btn-primary" onClick={onExport}>
            <Download size={16} /> Exportar JSON
          </button>
          <button className="btn-ghost" onClick={() => fileRef.current?.click()}>
            <Upload size={16} /> Importar JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImport(f);
              e.target.value = "";
            }}
          />
          <button
            className="btn-ghost destructive"
            onClick={() => {
              if (confirm("Apagar TODA a biblioteca e playlists? Esta ação não pode ser desfeita.")) {
                clearAllData();
                toast.success("Dados apagados");
              }
            }}
          >
            <Trash2 size={16} /> Limpar tudo
          </button>
        </div>
      </section>

      <section className="settings-card glass">
        <div className="settings-card-header">
          <div className="settings-icon">⌨</div>
          <div>
            <h2 className="settings-h2">Atalhos</h2>
            <p className="settings-help">Controle o player sem tirar as mãos do teclado.</p>
          </div>
        </div>
        <ul className="shortcut-list">
          <li><kbd>Espaço</kbd><span>Tocar / Pausar</span></li>
          <li><kbd>→</kbd><span>Próxima faixa</span></li>
          <li><kbd>←</kbd><span>Faixa anterior</span></li>
          <li><kbd>M</kbd><span>Mudo</span></li>
          <li><kbd>L</kbd><span>Repetir (off / all / one)</span></li>
          <li><kbd>S</kbd><span>Shuffle</span></li>
        </ul>
      </section>
    </motion.div>
  );
}
