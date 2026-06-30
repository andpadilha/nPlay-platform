import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { YOUTUBE_API_KEY } from "@/config/youtube";
import type { Track, Playlist } from "./youtube";

export type RepeatMode = "off" | "all" | "one";

type State = {
  // Library
  tracks: Record<string, Track>;
  trackOrder: string[];
  playlists: Record<string, Playlist>;
  playlistOrder: string[];

  // Player
  queue: string[];
  currentIndex: number;
  isPlaying: boolean;
  volume: number;
  muted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;

  // Settings
  apiKey: string;
};

type Actions = {
  // tracks
  addTrack: (t: Track) => void;
  removeTrack: (id: string) => void;

  // playlists
  createPlaylist: (name: string) => string;
  renamePlaylist: (id: string, name: string) => void;
  deletePlaylist: (id: string) => void;
  addToPlaylist: (playlistId: string, trackId: string) => void;
  removeFromPlaylist: (playlistId: string, trackId: string) => void;
  reorderPlaylist: (playlistId: string, fromIndex: number, toIndex: number) => void;

  // player
  playTrack: (trackId: string, contextIds?: string[]) => void;
  playQueue: (ids: string[], startIndex?: number) => void;
  next: () => void;
  prev: () => void;
  togglePlay: () => void;
  setIsPlaying: (v: boolean) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;

  // settings
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  clearAllData: () => void;
  importData: (json: string) => void;
  exportData: () => string;
};

const initialState: State = {
  tracks: {},
  trackOrder: [],
  playlists: {},
  playlistOrder: [],
  queue: [],
  currentIndex: -1,
  isPlaying: false,
  volume: 80,
  muted: false,
  shuffle: false,
  repeat: "off",
  apiKey: YOUTUBE_API_KEY,
};

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export const useStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...initialState,

      addTrack: (t) =>
        set((s) => {
          if (s.tracks[t.id]) return s;
          return {
            tracks: { ...s.tracks, [t.id]: t },
            trackOrder: [t.id, ...s.trackOrder],
          };
        }),

      removeTrack: (id) =>
        set((s) => {
          const { [id]: _, ...rest } = s.tracks;
          const newPlaylists: Record<string, Playlist> = {};
          for (const pid of Object.keys(s.playlists)) {
            const p = s.playlists[pid];
            newPlaylists[pid] = { ...p, trackIds: p.trackIds.filter((x) => x !== id) };
          }
          const newQueue = s.queue.filter((x) => x !== id);
          let idx = s.currentIndex;
          if (idx >= newQueue.length) idx = newQueue.length - 1;
          return {
            tracks: rest,
            trackOrder: s.trackOrder.filter((x) => x !== id),
            playlists: newPlaylists,
            queue: newQueue,
            currentIndex: idx,
          };
        }),

      createPlaylist: (name) => {
        const id = uid();
        set((s) => ({
          playlists: { ...s.playlists, [id]: { id, name, trackIds: [], createdAt: Date.now() } },
          playlistOrder: [id, ...s.playlistOrder],
        }));
        return id;
      },

      renamePlaylist: (id, name) =>
        set((s) => {
          const p = s.playlists[id];
          if (!p) return s;
          return { playlists: { ...s.playlists, [id]: { ...p, name } } };
        }),

      deletePlaylist: (id) =>
        set((s) => {
          const { [id]: _, ...rest } = s.playlists;
          return {
            playlists: rest,
            playlistOrder: s.playlistOrder.filter((x) => x !== id),
          };
        }),

      addToPlaylist: (playlistId, trackId) =>
        set((s) => {
          const p = s.playlists[playlistId];
          if (!p || p.trackIds.includes(trackId)) return s;
          return {
            playlists: {
              ...s.playlists,
              [playlistId]: { ...p, trackIds: [...p.trackIds, trackId] },
            },
          };
        }),

      removeFromPlaylist: (playlistId, trackId) =>
        set((s) => {
          const p = s.playlists[playlistId];
          if (!p) return s;
          return {
            playlists: {
              ...s.playlists,
              [playlistId]: { ...p, trackIds: p.trackIds.filter((x) => x !== trackId) },
            },
          };
        }),

      reorderPlaylist: (playlistId, fromIndex, toIndex) =>
        set((s) => {
          const p = s.playlists[playlistId];
          if (!p) return s;
          const ids = [...p.trackIds];
          const [moved] = ids.splice(fromIndex, 1);
          ids.splice(toIndex, 0, moved);
          return {
            playlists: { ...s.playlists, [playlistId]: { ...p, trackIds: ids } },
          };
        }),

      playTrack: (trackId, contextIds) => {
        const s = get();

        if (contextIds && contextIds.length) {
          const idx = contextIds.indexOf(trackId);
          set({
            queue: contextIds,
            currentIndex: idx >= 0 ? idx : 0,
            isPlaying: true,
          });
          return;
        }

        if (!s.queue.length) {
          set({ queue: [trackId], currentIndex: 0, isPlaying: true });
          return;
        }

        if (s.queue.includes(trackId)) {
          const idx = s.queue.indexOf(trackId);
          set({ currentIndex: idx, isPlaying: true });
          return;
        }

        set({
          queue: [trackId, ...s.queue],
          currentIndex: 0,
          isPlaying: true,
        });
      },

      playQueue: (ids, startIndex = 0) => {
        if (!ids.length) return;
        set({ queue: ids, currentIndex: Math.max(0, Math.min(startIndex, ids.length - 1)), isPlaying: true });
      },

      next: () => {
        const s = get();
        if (!s.queue.length) return;
        if (s.shuffle && s.queue.length > 1) {
          let i = Math.floor(Math.random() * s.queue.length);
          if (i === s.currentIndex) i = (i + 1) % s.queue.length;
          set({ currentIndex: i, isPlaying: true });
          return;
        }
        const nextIdx = s.currentIndex + 1;
        if (nextIdx >= s.queue.length) {
          if (s.repeat === "all") set({ currentIndex: 0, isPlaying: true });
          else set({ isPlaying: false });
          return;
        }
        set({ currentIndex: nextIdx, isPlaying: true });
      },

      prev: () => {
        const s = get();
        if (!s.queue.length) return;
        const p = s.currentIndex - 1;
        if (p < 0) {
          set({ currentIndex: 0, isPlaying: true });
          return;
        }
        set({ currentIndex: p, isPlaying: true });
      },

      togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
      setIsPlaying: (v) => set({ isPlaying: v }),
      toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),
      cycleRepeat: () =>
        set((s) => ({
          repeat: s.repeat === "off" ? "all" : s.repeat === "all" ? "one" : "off",
        })),
      setVolume: (v) => set({ volume: Math.max(0, Math.min(100, v)), muted: v === 0 }),
      toggleMute: () => set((s) => ({ muted: !s.muted })),

      setApiKey: (key) =>
        set({
          apiKey: key.trim() || YOUTUBE_API_KEY,
        }),

      clearApiKey: () =>
        set({
          apiKey: YOUTUBE_API_KEY,
        }),
      clearAllData: () =>
        set({
          tracks: {},
          trackOrder: [],
          playlists: {},
          playlistOrder: [],
          queue: [],
          currentIndex: -1,
          isPlaying: false,
        }),
      importData: (json) => {
        try {
          const data = JSON.parse(json);
          set((s) => ({
            tracks: data.tracks ?? s.tracks,
            trackOrder: data.trackOrder ?? s.trackOrder,
            playlists: data.playlists ?? s.playlists,
            playlistOrder: data.playlistOrder ?? s.playlistOrder,
          }));
        } catch {
          throw new Error("JSON inválido");
        }
      },
      exportData: () => {
        const s = get();
        return JSON.stringify(
          {
            tracks: s.tracks,
            trackOrder: s.trackOrder,
            playlists: s.playlists,
            playlistOrder: s.playlistOrder,
          },
          null,
          2,
        );
      },
    }),
    {
      name: "nortiplay:v1",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,

      partialize: (s) => ({
        tracks: s.tracks,
        trackOrder: s.trackOrder,
        playlists: s.playlists,
        playlistOrder: s.playlistOrder,
        queue: s.queue,
        currentIndex: s.currentIndex,
        volume: s.volume,
        muted: s.muted,
        shuffle: s.shuffle,
        repeat: s.repeat,
      }),
    },
  ),
);

// Selector for current track
export const currentTrack = (s: State) => {
  const id = s.queue[s.currentIndex];
  return id ? s.tracks[id] : undefined;
};
