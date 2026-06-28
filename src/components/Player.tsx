import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  PictureInPicture2,
  ListMusic,
  X,
  ChevronDown,
} from "lucide-react";

import { useStore, currentTrack } from "@/lib/store";
import { formatTime } from "@/lib/youtube";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import "./Player.css";

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
    documentPictureInPicture?: {
      requestWindow: (opts?: {
        width?: number;
        height?: number;
        minWidth?: number;
        minHeight?: number;
      }) => Promise<Window>;
      window: Window | null;
    };
  }
}

let ytApiPromise: Promise<void> | null = null;

function loadYouTubeAPI(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise((resolve) => {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => resolve();
  });
  return ytApiPromise;
}

export function Player() {
  const [mounted, setMounted] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setMounted(true);
    const rehydrate = async () => {
      await useStore.persist.rehydrate();
      setHydrated(true);
    };
    void rehydrate();
  }, []);

  if (!mounted || !hydrated) return null;
  return <PlayerInner />;
}

function PlayerInner() {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const ready = useRef(false);
  const autoPlayRef = useRef(true);

  const track = useStore(currentTrack);
  const isPlaying = useStore((s) => s.isPlaying);
  const volume = useStore((s) => s.volume);
  const muted = useStore((s) => s.muted);
  const repeat = useStore((s) => s.repeat);
  const shuffle = useStore((s) => s.shuffle);
  const queue = useStore((s) => s.queue);
  const currentIndex = useStore((s) => s.currentIndex);


  const next = useStore((s) => s.next);
  const prev = useStore((s) => s.prev);
  const togglePlay = useStore((s) => s.togglePlay);

  const setIsPlaying = useStore((s) => s.setIsPlaying);

  useEffect(() => {
    setIsPlaying(false);
  }, [setIsPlaying]);

  const toggleShuffle = useStore((s) => s.toggleShuffle);
  const cycleRepeat = useStore((s) => s.cycleRepeat);
  const setVolume = useStore((s) => s.setVolume);
  const toggleMute = useStore((s) => s.toggleMute);

  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showQueue, setShowQueue] = useState(false);
  const [pipDoc, setPipDoc] = useState<Document | null>(null);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!track) return;
    setProgress(0);
    setDuration(0);
  }, [track?.id]);



  // refs to avoid stale closures inside YT event callbacks
  const repeatRef = useRef(repeat);
  const nextRef = useRef(next);
  useEffect(() => {
    repeatRef.current = repeat;
  }, [repeat]);
  useEffect(() => {
    nextRef.current = next;
  }, [next]);

  useEffect(() => {
    if (!isMobile && isMobileExpanded) {
      setIsMobileExpanded(false);
    }
  }, [isMobile, isMobileExpanded]);

  useEffect(() => {
    if (isMobileExpanded && isMobile) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileExpanded, isMobile]);

  const requestPip = async () => {
    if (!("documentPictureInPicture" in window) || !window.documentPictureInPicture) return;
    if (pipDoc) {
      pipDoc.defaultView?.close();
      setPipDoc(null);
      return;
    }
    try {
      const win = await window.documentPictureInPicture.requestWindow({
        width: 380,
        height: 540,
        minWidth: 200,
        minHeight: 200,
      });
      document.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
        win.document.head.appendChild(node.cloneNode(true));
      });
      win.document.body.style.background = "#0f0a1e";
      setPipDoc(win.document);
      win.addEventListener("pagehide", () => setPipDoc(null));
    } catch (e) {
      console.error("Erro ao abrir PiP:", e);
    }
  };

  useEffect(() => {
    if (!ready.current || !playerRef.current) return;
    try {
      if (muted) {
        playerRef.current.mute();
      } else {
        playerRef.current.unMute();
        playerRef.current.setVolume(volume);
      }
    } catch {
      /* noop */
    }
  }, [volume, muted]);

  useEffect(() => {
    let cancelled = false;
    loadYouTubeAPI().then(() => {
      if (cancelled || !containerRef.current || playerRef.current) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        height: "100%",
        width: "100%",
        playerVars: { controls: 0, modestbranding: 1, rel: 0, playsinline: 1 },
        events: {
          onReady: () => {
            ready.current = true;
            try {
              playerRef.current.setVolume(muted ? 0 : volume);
              if (track) {
                playerRef.current.cueVideoById(track.id);
              }
            } catch (e) { }
          },
          onStateChange: (e: any) => {
            if (e.data === window.YT.PlayerState.ENDED) {
              if (repeatRef.current === "one") {
                try {
                  playerRef.current.seekTo(0, true);
                  playerRef.current.playVideo();
                } catch {
                  /* noop */
                }
              } else {
                autoPlayRef.current = true;
                nextRef.current();
              }
            }
            if (e.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              try {
                setDuration(playerRef.current.getDuration() || 0);
              } catch {
                /* noop */
              }
            }
            if (e.data === window.YT.PlayerState.PAUSED) {
              if (!autoPlayRef.current) setIsPlaying(false);
            }
          },
        },
      });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready.current || !playerRef.current || !track) return;
    try {
      playerRef.current.loadVideoById(track.id);
      playerRef.current.pauseVideo(); // Garante que carregue pausado
    } catch (e) {
      console.error("Erro ao carregar vídeo:", e);
    }
  }, [track?.id]);

  useEffect(() => {
    if (!ready.current || !playerRef.current) return;
    try {
      if (isPlaying) {
        autoPlayRef.current = true;
        playerRef.current.playVideo();
      } else {
        autoPlayRef.current = false;
        playerRef.current.pauseVideo();
      }
    } catch {
      /* noop */
    }
  }, [isPlaying]);

  useEffect(() => {
    const t = setInterval(() => {
      if (!playerRef.current?.getCurrentTime) return;
      try {
        setProgress(playerRef.current.getCurrentTime() || 0);
      } catch {
        /* noop */
      }
    }, 500);
    return () => clearInterval(t);
  }, []);

  const seek = (pct: number) => {
    if (!playerRef.current || !duration) return;
    try {
      playerRef.current.seekTo(pct * duration, true);
      setProgress(pct * duration);
    } catch {
      /* noop */
    }
  };

  const tracksMap = useStore((s) => s.tracks);
  const queueTracks = useMemo(
    () => queue.map((id) => tracksMap[id]).filter(Boolean),
    [queue, tracksMap],
  );

  return (
    <>
      <div className="engineWrapper">
        <div ref={containerRef} className="engineContainer" />
      </div>
      <PlayerBar
        track={track}
        isPlaying={isPlaying}
        progress={progress}
        duration={duration}
        volume={volume}
        muted={muted}
        repeat={repeat}
        shuffle={shuffle}
        queue={queueTracks}
        currentIndex={currentIndex}
        onPlay={togglePlay}
        onNext={() => {
          autoPlayRef.current = true;
          next();
        }}
        onPrev={() => {
          autoPlayRef.current = true;
          prev();
        }}
        onSeek={seek}
        onVolume={setVolume}
        onMute={toggleMute}
        onShuffle={toggleShuffle}
        onRepeat={cycleRepeat}
        onToggleQueue={() => setShowQueue((v) => !v)}
        onPip={requestPip}
        showQueue={showQueue}
        pipActive={!!pipDoc}
        isMobileExpanded={isMobileExpanded}
        setIsMobileExpanded={setIsMobileExpanded}
        isMobile={isMobile}
      />
      {showQueue && <QueueDrawer onClose={() => setShowQueue(false)} />}
      {pipDoc &&
        createPortal(
          <PipView
            track={track}
            isPlaying={isPlaying}
            progress={progress}
            duration={duration}
            onPlay={togglePlay}
            onNext={next}
            onPrev={prev}
            onSeek={seek}
            onClose={() => {
              pipDoc.defaultView?.close();
              setPipDoc(null);
            }}
          />,
          pipDoc.body,
        )}
    </>
  );
}

function PipView({ track, isPlaying, progress, duration, onPlay, onNext, onPrev, onSeek, onClose }: any) {
  const pct = duration ? progress / duration : 0;
  return (
    <div className="pipContainer">
      <div className="pipHeader">
        <div className="pipTitleText">Norti Play</div>
        <button onClick={onClose} className="pipCloseButton">
          <X size={14} />
        </button>
      </div>
      {track ? (
        <>
          <img src={track.thumbnail} alt="" className="pipThumbnail" />
          <div className="pipTextWrapper">
            <div className="pipTrackTitle">{track.title}</div>
            <div className="pipTrackAuthor">{track.author}</div>
          </div>
          <div className="pipProgressContainer">
            <div
              className="pipProgressTrack"
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                onSeek(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)));
              }}
            >
              <div className="pipProgressBar" style={{ width: `${pct * 100}%` }} />
            </div>
            <div className="pipTimeLabel">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
          <div className="pipControls">
            <button className="pipNavButton" onClick={onPrev}>
              <SkipBack size={20} />
            </button>
            <button onClick={onPlay} className="pipPlayButton">
              {isPlaying ? <Pause size={26} /> : <Play size={26} />}
            </button>
            <button className="pipNavButton" onClick={onNext}>
              <SkipForward size={20} />
            </button>
          </div>
        </>
      ) : (
        <div className="pipEmptyState">Nenhuma faixa em reprodução</div>
      )}
    </div>
  );
}

function PlayerBar(p: any) {
  const pct = p.duration ? (p.progress / p.duration) * 100 : 0;
  const hasTrack = !!p.track;

  return (
    <footer className={cn(
      "player-footer",
      p.isMobileExpanded && p.isMobile && "mobile-fullscreen glass"
    )}>
      {p.isMobileExpanded && p.isMobile && (
        <div className="fullscreen-header">
          <button className="btn-minimize" onClick={() => p.setIsMobileExpanded(false)}>
            <ChevronDown size={28} />
          </button>
          <div className="fullscreen-header-title">Tocando agora</div>
          <div style={{ width: 28 }} />
        </div>
      )}

      <div
        className={cn(
          "player-bar-container glass",
          p.isMobileExpanded && p.isMobile && "expanded-layout",
          !hasTrack && "opacity-70"
        )}
        onClick={() => {
          if (hasTrack && !p.isMobileExpanded && p.isMobile) p.setIsMobileExpanded(true);
        }}
      >
        <div className="track-info">
          {hasTrack ? (
            <>
              <img src={p.track.thumbnail} alt="" className="track-thumb" />
              <div className="track-text">
                <div className="track-title">{p.track.title}</div>
                <div className="track-author">{p.track.author}</div>
              </div>
            </>
          ) : (
            <div className="track-text">
              <div className="track-title" style={{ opacity: 0.5 }}>Última música</div>
            </div>
          )}
        </div>

        <div className="controls-center" style={{ pointerEvents: hasTrack ? "auto" : "none" }}>
          <div className="progress-wrapper">
            <span className="time-indicator tabular-nums">{hasTrack ? formatTime(p.progress) : "--:--"}</span>
            <ProgressBar value={hasTrack ? pct : 0} onSeek={p.onSeek} />
            <span className="time-indicator tabular-nums">{hasTrack ? formatTime(p.duration) : "--:--"}</span>
          </div>

          <div className="controls-buttons">
            <IconBtn disabled={!hasTrack} onClick={p.onShuffle} active={p.shuffle} className="hide-on-mini">
              <Shuffle size={18} />
            </IconBtn>
            <IconBtn disabled={!hasTrack} onClick={p.onPrev} className="hide-on-mini">
              <SkipBack size={20} />
            </IconBtn>

            <button
              className="btn-play-pause"
              onClick={(e) => { e.stopPropagation(); p.onPlay(); }}
              disabled={!hasTrack}
            >
              {p.isPlaying ? <Pause size={22} /> : <Play size={22} />}
            </button>

            <IconBtn disabled={!hasTrack} onClick={p.onNext}>
              <SkipForward size={20} />
            </IconBtn>
            <IconBtn disabled={!hasTrack} onClick={p.onRepeat} active={p.repeat !== "off"} className="hide-on-mini">
              {p.repeat === "one" ? <Repeat1 size={18} /> : <Repeat size={18} />}
            </IconBtn>
          </div>
        </div>

        <div className="controls-right" style={{ pointerEvents: hasTrack ? "auto" : "none" }}>
          <div className="utility-buttons-wrapper" style={{ display: "flex", gap: 4 }}>
            <IconBtn disabled={!hasTrack} onClick={p.onToggleQueue} active={p.showQueue}>
              <ListMusic size={18} />
            </IconBtn>
            <IconBtn disabled={!hasTrack} onClick={p.onPip} active={p.pipActive} className="hide-on-mobile-fs">
              <PictureInPicture2 size={18} />
            </IconBtn>
          </div>

          <div className="volume-container-box" style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <IconBtn disabled={!hasTrack} onClick={p.onMute}>
              {p.muted || p.volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </IconBtn>
            <input
              type="range"
              min={0}
              max={100}
              value={hasTrack ? (p.muted ? 0 : p.volume) : 0}
              onChange={(e) => p.onVolume(Number(e.target.value))}
              className="volume-slider"
              disabled={!hasTrack}
            />
          </div>
        </div>
      </div>
    </footer>
  );
}

function ProgressBar({ value, onSeek }: { value: number; onSeek: (pct: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      onClick={(e) => {
        e.stopPropagation();
        if (!ref.current) return;
        const r = ref.current.getBoundingClientRect();
        onSeek(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)));
      }}
      className="progress-track"
    >
      <div className="progress-fill" style={{ ["--progress-pct" as any]: `${value}%` }} />
    </div>
  );
}

function IconBtn({ children, onClick, active, className }: any) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
      className={cn("btn-icon", active && "active", className)}
    >
      {children}
    </button>
  );
}

function QueueDrawer({ onClose }: { onClose: () => void }) {
  const queue = useStore((s) => s.queue);
  const tracks = useStore((s) => s.tracks);
  const currentIndex = useStore((s) => s.currentIndex);
  const playQueue = useStore((s) => s.playQueue);

  return (
    <div className="queue-drawer glass">
      <div className="queue-header">
        <h3 className="queue-title">Fila de reprodução</h3>
        <button onClick={onClose} className="queue-close-btn">
          Fechar
        </button>
      </div>
      <div className="queue-scroll-area">
        {queue.map((id, i) => {
          const t = tracks[id];
          const active = i === currentIndex;
          if (!t) return null;
          return (
            <button
              key={`${id}-${i}`}
              onClick={() => playQueue(queue, i)}
              className={active ? "queue-item active" : "queue-item"}
            >
              <img src={t.thumbnail} alt="" className="queue-thumb" />
              <div className="queue-info">
                <div className={active ? "queue-item-title active" : "queue-item-title"}>{t.title}</div>
                <div className="track-author">{t.author}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
