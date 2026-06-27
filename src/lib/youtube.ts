export type Track = {
  id: string;
  title: string;
  author: string;
  thumbnail: string;
  duration?: number;
  addedAt: number;
};

export type Playlist = {
  id: string;
  name: string;
  trackIds: string[];
  createdAt: number;
};

export type SearchResult = {
  id: string;
  title: string;
  author: string;
  thumbnail: string;
};

const YT_HOSTS = ["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be"];

export function extractYouTubeId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    if (!YT_HOSTS.includes(url.hostname)) return null;
    if (url.hostname === "youtu.be") return url.pathname.slice(1).slice(0, 11) || null;
    const v = url.searchParams.get("v");
    if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
    const m = url.pathname.match(/\/(embed|shorts|v|live)\/([a-zA-Z0-9_-]{11})/);
    if (m) return m[2];
  } catch {
    return null;
  }
  return null;
}

export function extractPlaylistId(input: string): string | null {
  if (!input) return null;
  try {
    const url = new URL(input.trim());
    if (!YT_HOSTS.includes(url.hostname)) return null;
    const list = url.searchParams.get("list");
    if (list && /^[A-Za-z0-9_-]+$/.test(list)) return list;
  } catch {
    return null;
  }
  return null;
}

export async function fetchOEmbedMeta(videoId: string): Promise<{
  title: string;
  author: string;
  thumbnail: string;
}> {
  const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(
    `https://www.youtube.com/watch?v=${videoId}`,
  )}&format=json`;
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error();
    const j = await r.json();
    return {
      title: j.title ?? `Vídeo ${videoId}`,
      author: j.author_name ?? "Desconhecido",
      thumbnail: j.thumbnail_url ?? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    };
  } catch {
    return {
      title: `Vídeo ${videoId}`,
      author: "Desconhecido",
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    };
  }
}

export async function searchYouTube(query: string, apiKey: string): Promise<SearchResult[]> {
  if (!apiKey) throw new Error("API Key não configurada");
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", "24");
  url.searchParams.set("q", query);
  url.searchParams.set("key", apiKey);
  const r = await fetch(url.toString());
  if (!r.ok) {
    const err = await r.json().catch(() => null);
    throw new Error(err?.error?.message || "Falha na busca");
  }
  const j = await r.json();
  return (j.items || []).map((it: any) => ({
    id: it.id.videoId,
    title: it.snippet.title,
    author: it.snippet.channelTitle,
    thumbnail:
      it.snippet.thumbnails?.medium?.url ||
      it.snippet.thumbnails?.default?.url ||
      `https://i.ytimg.com/vi/${it.id.videoId}/hqdefault.jpg`,
  }));
}

export async function fetchYouTubePlaylist(
  playlistId: string,
  apiKey: string,
): Promise<{ title: string; items: Track[] }> {
  if (!apiKey) throw new Error("API Key não configurada");
  const metaUrl = new URL("https://www.googleapis.com/youtube/v3/playlists");
  metaUrl.searchParams.set("part", "snippet");
  metaUrl.searchParams.set("id", playlistId);
  metaUrl.searchParams.set("key", apiKey);
  const metaR = await fetch(metaUrl.toString());
  if (!metaR.ok) throw new Error("Falha ao carregar playlist");
  const metaJ = await metaR.json();
  const title = metaJ.items?.[0]?.snippet?.title || "Playlist";

  const items: Track[] = [];
  let pageToken: string | undefined;
  do {
    const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("maxResults", "50");
    url.searchParams.set("playlistId", playlistId);
    url.searchParams.set("key", apiKey);
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const r = await fetch(url.toString());
    if (!r.ok) throw new Error("Falha ao carregar itens da playlist");
    const j = await r.json();
    for (const it of j.items || []) {
      const id = it.snippet?.resourceId?.videoId;
      if (!id) continue;
      items.push({
        id,
        title: it.snippet.title,
        author: it.snippet.videoOwnerChannelTitle || it.snippet.channelTitle || "Desconhecido",
        thumbnail:
          it.snippet.thumbnails?.medium?.url ||
          it.snippet.thumbnails?.default?.url ||
          `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        addedAt: Date.now(),
      });
    }
    pageToken = j.nextPageToken;
  } while (pageToken && items.length < 200);

  return { title, items };
}

export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
