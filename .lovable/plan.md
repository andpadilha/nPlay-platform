# Norti Play — Plano de Reconstrução

App 100% client-side, sem backend, sem auth, persistência em `localStorage`. Visual fiel aos componentes do `.rar` enviado (AppShell, Sidebar, Player, AddTrackBar, TrackCard, PlaylistStackCard).

## 1. Limpeza da stack base

- Remover Tailwind do projeto: desinstalar `tailwindcss`, `tw-animate-css`, limpar `src/styles.css` e qualquer `@apply`/utilitário.
- Manter TanStack Start + TanStack Router (já no template). Remover shadcn/ui não utilizado para evitar dependência implícita de Tailwind.
- Adicionar: `zustand`, `framer-motion`, `@fontsource/outfit`, `@fontsource/figtree`.
- Substituir `src/styles.css` por um design system em CSS puro (variáveis, reset, utilitários mínimos `.container`, `.row`, etc.). Importar fontes via `@fontsource` no `__root.tsx`.

## 2. Design System (`src/styles/`)

- `tokens.css` — variáveis CSS: `--bg #0f0a1e`, `--primary #8b5cf6`, `--accent #ec4899`, `--highlight #f59e0b`, gradientes aurora (roxo→rosa→âmbar), raios, sombras, blur do glass, durações de animação.
- `reset.css` — reset moderno + dark mode nativo.
- `typography.css` — Outfit (títulos), Figtree (UI).
- `globals.css` — body, scrollbars, seleção, foco acessível.
- Convenção: cada componente tem seu próprio `Component.css` co-localizado (igual ao `.rar`). Sem Tailwind, sem `style={{}}`.

## 3. Estrutura de pastas

```text
src/
  config/youtube.ts         # YOUTUBE_API_KEY padrão
  store/
    usePlayerStore.ts       # queue, currentIndex, isPlaying, volume, shuffle, repeat
    useLibraryStore.ts      # tracks, playlists (persist)
    useSettingsStore.ts     # apiKey, prefs (persist)
  lib/
    youtube.ts              # parseVideoId, oEmbed, search Data API
    persist.ts              # helpers Zustand persist
    shortcuts.ts            # hook de atalhos de teclado
    pip.ts                  # Picture-in-Picture + Document PiP fallback
  components/
    layout/AppShell, Sidebar, MobileNav
    player/Player, MiniPlayer, ProgressBar, VolumeControl, Queue
    library/TrackCard, PlaylistStackCard, AddTrackBar, AddTrackModal
    ui/GlassCard, Button, IconButton, Modal, Toast
    search/SearchResults, SearchBar
    settings/SettingsForm
  routes/
    __root.tsx              # AppShell + Player global
    index.tsx               # Biblioteca
    playlist.$id.tsx        # Detalhes
    search.tsx              # Busca YouTube
    settings.tsx            # Settings
  styles/ (tokens, reset, typography, globals)
```

Os componentes do `.rar` (`AppShell`, `Sidebar`, `Player`, `AddTrackBar`, `TrackCard`, `PlaylistStackCard`) entram com seus `.css` originais, adaptados aos stores/rotas reais.

## 4. Estado global (Zustand + persist)

- `useLibraryStore`: `tracks: Track[]`, `playlists: Playlist[]`, ações add/remove/rename/reorder, import/export JSON.
- `usePlayerStore`: `queue`, `currentIndex`, `isPlaying`, `progress`, `duration`, `volume`, `muted`, `shuffle`, `repeat: 'off'|'all'|'one'`, ações play/pause/next/prev/seek/setQueue.
- `useSettingsStore`: `youtubeApiKey` (default = config), `theme`.
- Persistência via `zustand/middleware/persist` (chave `nortiplay:v1`).

## 5. Player global (YouTube IFrame API)

- Componente `<Player />` montado **uma vez** no `__root.tsx`, abaixo do `<Outlet />`. Nunca desmonta ao trocar de rota → reprodução contínua estável.
- Carrega IFrame API uma vez, mantém instância única do `YT.Player` ligada ao `usePlayerStore`.
- UI: capa, título, canal, play/pause, prev/next, progresso clicável, volume, mute, shuffle, repeat (off/all/one), botão de fila, botão PiP.
- Mobile: vira bottom sheet (drag-to-expand).

## 6. Picture-in-Picture

- Tenta `videoEl.requestPictureInPicture()` no `<video>` interno do iframe quando exposto; se indisponível, usa **Document Picture-in-Picture API** (`documentPictureInPicture.requestWindow`) renderizando um `<MiniPlayer />` customizado dentro da janela PiP via portal.
- Botão se desabilita se nenhuma das APIs estiver disponível.

## 7. Adicionar por URL (sempre disponível)

- `AddTrackBar` no topo da Biblioteca + `AddTrackModal` global.
- `parseVideoId(input)` aceita URL longa/curta/`embed`/ID puro.
- Metadados via `https://www.youtube.com/oembed?url=...&format=json` (sem API key) → título, autor, thumbnail. Duração só quando disponível via Data API.

## 8. Busca YouTube (Data API v3)

- `src/config/youtube.ts` exporta `YOUTUBE_API_KEY` (chave fornecida pelo usuário).
- `useSettingsStore` carrega chave: `localStorage` > config padrão.
- `/search`: input + grid de cards glass (thumb, título, canal, botão +).
- Sem chave: estado vazio "Configure sua chave para pesquisar" com link para `/settings`. URL flow continua funcionando.

## 9. Playlists

- Criar, renomear, deletar, adicionar/remover faixas.
- Reordenação drag-and-drop com `@dnd-kit/core` + `@dnd-kit/sortable`.
- `/playlist/$id`: capa empilhada (PlaylistStackCard), lista ordenada, "Tocar tudo", "Embaralhar".

## 10. Rotas

- `/` Biblioteca — grid de TrackCards + AddTrackBar + seção de playlists.
- `/playlist/$id` Detalhes.
- `/search` Busca.
- `/settings` API key (ver/editar/remover), limpar dados, exportar JSON, importar JSON.

Cada rota com `head()` próprio (title, description, og).

## 11. Atalhos globais

Hook `useShortcuts` no `__root.tsx`:
- `Space` play/pause · `→`/`←` próxima/anterior · `M` mute · `L` cicla repeat · `S` toggle shuffle.
- Ignora quando foco em input/textarea.

## 12. Animações (Framer Motion)

- Page transitions (fade + slight rise) no `<Outlet />`.
- Stagger nos cards da biblioteca.
- Hover lift nos `TrackCard`/`PlaylistStackCard`.
- Pulse no botão play da faixa ativa.
- Sidebar/Bottom sheet com spring.

## 13. Responsividade

- Breakpoints CSS: `>=1024px` desktop com sidebar fixa; `<1024px` sidebar vira drawer; `<768px` player vira bottom sheet.
- Grids fluidos com `grid-template-columns: repeat(auto-fill, minmax(...))`.

## 14. Entrega

Tudo implementado de uma vez: design system, layout, stores persistentes, add por URL, player global YouTube, playlists com DnD, busca, settings (com import/export), responsividade, atalhos, PiP.

---

## Pendência antes de codar

**Preciso da sua YouTube Data API v3 key** para colocar como valor padrão em `src/config/youtube.ts`. Sem ela, o app sobe funcionando (URL flow + tudo o resto), mas `/search` ficará pedindo configuração até você adicionar em Settings.
