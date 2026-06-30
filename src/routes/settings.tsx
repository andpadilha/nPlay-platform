import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useRef, useState, useMemo } from "react";
import { toast } from "sonner";
import { Download, Upload, Trash2, KeyRound, Save, EyeOff, Eye, Palette, RotateCcw } from "lucide-react";
import { useStore } from "@/lib/store";
import { YOUTUBE_API_KEY } from "@/config/youtube";
import "@/styles/page.css";
import "@/styles/settings.css";

const BRAND_STORAGE_KEY = "nortiplay:brand-color";
const STATIC_PRESETS = ["#7c3aed", "#38bdf8", "#f43f5e", "#00D647", "#f472b6"];

function normalizeBrandColor(value: string | null | undefined) {
  if (!value) return null;
  const cleaned = value.trim();
  if (!cleaned) return null;

  const withHash = cleaned.startsWith("#") ? cleaned : `#${cleaned}`;
  if (/^#[0-9a-fA-F]{3}$/.test(withHash)) {
    const expanded = withHash
      .slice(1)
      .split("")
      .map((char) => char + char)
      .join("");
    return `#${expanded.toLowerCase()}`;
  }

  if (/^#[0-9a-fA-F]{6}$/.test(withHash)) {
    return withHash.toLowerCase();
  }

  return null;
}

function getDefaultBrandColor() {
  if (typeof window === "undefined") return "#ffb35d";

  const rootStyle = getComputedStyle(document.documentElement);
  const value = rootStyle.getPropertyValue("--brand").trim();

  return value ? value : "#d97706";
}

function hexToRgb(hex: string) {
  const normalized = normalizeBrandColor(hex);
  if (!normalized) return { r: 255, g: 255, b: 255 };

  const value = normalized.slice(1);
  const full = value.length === 3
    ? value.split("").map((char) => char + char).join("")
    : value;

  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

function getContrastTextColor(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.62 ? "#111111" : "#ffffff";
}

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Norti Play - Configurações" },
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

  const defaultColor = useMemo(() => getDefaultBrandColor(), []);

  const PRESET_COLORS = STATIC_PRESETS;

  const initialBrandColor = useMemo(() => {
    if (typeof window === "undefined") return defaultColor;
    const saved = localStorage.getItem(BRAND_STORAGE_KEY);
    return normalizeBrandColor(saved) ?? defaultColor;
  }, [defaultColor]);

  const [draft, setDraft] = useState(apiKey);
  const [show, setShow] = useState(false);
  const [brandColor, setBrandColor] = useState(initialBrandColor);
  const [customColor, setCustomColor] = useState(initialBrandColor);
  const [brandInput, setBrandInput] = useState(initialBrandColor);
  const [selectedColorMode, setSelectedColorMode] = useState<"preset" | "custom">(() => {
    if (typeof window === "undefined") return "preset";

    const saved = localStorage.getItem(BRAND_STORAGE_KEY);
    const normalizedSaved = normalizeBrandColor(saved);

    if (!normalizedSaved) return "preset";

    return STATIC_PRESETS.some((preset) => preset.toLowerCase() === normalizedSaved.toLowerCase()) ? "preset" : "custom";
  });
  const fileRef = useRef<HTMLInputElement>(null);
  const customColorInputRef = useRef<HTMLInputElement>(null);

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


  const applyBrandColor = () => {
  const normalized = normalizeBrandColor(
    selectedColorMode === "custom" ? customColor : brandColor,
  );

  if (!normalized) {
    toast.error("Digite uma cor válida em formato hexadecimal.");
    return;
  }

  // Aplica imediatamente no app
  const textOnBrand = getContrastTextColor(normalized);

  document.documentElement.style.setProperty("--brand", normalized);
  document.documentElement.style.setProperty("--text-on-brand", textOnBrand);

  // Salva para o próximo carregamento
  localStorage.setItem(BRAND_STORAGE_KEY, normalized);

  // Atualiza os estados da tela de Configurações
  setBrandColor(normalized);
  setCustomColor(normalized);
  setBrandInput(normalized);
  setSelectedColorMode(
    PRESET_COLORS.some(
      (preset) => preset.toLowerCase() === normalized.toLowerCase(),
    )
      ? "preset"
      : "custom",
  );

  toast.success("Tema atualizado");
};

const resetBrandColor = () => {
  localStorage.removeItem(BRAND_STORAGE_KEY);

  document.documentElement.style.removeProperty("--brand");
  document.documentElement.style.removeProperty("--text-on-brand");

  const currentDefault = getDefaultBrandColor();

  setBrandColor(currentDefault);
  setCustomColor(currentDefault);
  setBrandInput(currentDefault);
  setSelectedColorMode("preset");

  toast.success("Tema restaurado para o padrão original");
};

  return (
    <motion.div className="page" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <header className="page-header">
        <h1 className="page-title">Configurações</h1>
        <p className="page-subtitle">Personalize o Norti Play e gerencie seus dados.</p>
      </header>

      <section className="settings-card glass">
        <div className="settings-card-header">
          <div className="settings-icon"><KeyRound size={18} /></div>
          <div>
            <h2 className="settings-h2">YouTube API Key</h2>
            <p className="settings-help">Necessária para buscar por palavras-chave. Adicionar por URL funciona sem chave.</p>
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
          <button className="btn-primary" onClick={save}><Save size={16} /> Salvar</button>
          <button className="btn-ghost destructive" onClick={() => { clearApiKey(); setDraft(""); toast.success("Chave removida"); }}>
            <Trash2 size={16} /> Remover
          </button>
        </div>
      </section>

      <section className="settings-card glass">
        <div className="settings-card-header">
          <div className="settings-icon"><Palette size={18} /></div>
          <div>
            <h2 className="settings-h2">Tema da plataforma</h2>
            <p className="settings-help">Escolha uma cor principal para atualizar a identidade visual do app.</p>
          </div>
        </div>
        <div className="theme-picker-shell">
          <div className="theme-preview-card" style={{ background: `linear-gradient(135deg, ${brandColor}, color-mix(in srgb, ${brandColor} 55%, white 20%))` }}>
            <div className="theme-preview-content">
              <span className="theme-preview-pill">Preview ao vivo</span>
              <div className="theme-preview-title">A identidade da sua plataforma</div>
              <div className="theme-preview-subtitle">As cores do app mudam em tempo real para combinar com o seu estilo.</div>
            </div>
          </div>
          <div className="theme-controls">
            <div className="theme-picker-inline">
              <label className="theme-field theme-field-custom">
                <span>Custom</span>
                <div className="theme-custom-picker">
                  <button
                    type="button"
                    className={`theme-custom-pill ${selectedColorMode === "custom" ? "active" : ""}`}
                    onClick={() => {
                      setBrandColor(customColor);
                      setBrandInput(customColor);
                      setSelectedColorMode("custom");
                    }}
                    style={{ backgroundColor: customColor, color: getContrastTextColor(customColor) }}
                  >
                    <span className="theme-custom-pill-value">{customColor.toUpperCase()}</span>
                    <button
                      type="button"
                      className="theme-custom-pill-button"
                      onClick={() => customColorInputRef.current?.click()}
                      aria-label="Escolher cor personalizada"
                    >
                      <Palette size={14} />
                    </button>
                  </button>
                  <input
                    ref={customColorInputRef}
                    type="color"
                    value={customColor}
                    onChange={(e) => {
                      const nextColor = e.target.value;
                      setCustomColor(nextColor);
                      setBrandColor(nextColor);
                      setBrandInput(nextColor);
                      setSelectedColorMode("custom");
                    }}
                    className="theme-color-input-hidden"
                  />
                </div>
              </label>
            </div>
            <div className="theme-swatches">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={`theme-swatch ${selectedColorMode === "preset" && brandColor === preset ? "active" : ""}`}
                  onClick={() => {
                    setBrandColor(preset);
                    setSelectedColorMode("preset");
                  }}
                  style={{ backgroundColor: preset }}
                />
              ))}
            </div>
            <div className="settings-row">
              <button className="btn-primary" onClick={applyBrandColor}><Save size={16} /> Aplicar tema</button>
              <button className="btn-ghost" onClick={resetBrandColor}><RotateCcw size={16} /> Restaurar</button>
            </div>
          </div>
        </div>
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
