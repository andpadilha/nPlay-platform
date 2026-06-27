import { useEffect } from "react";
import { useStore } from "./store";

export function useGlobalShortcuts() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable) return;
      }
      const s = useStore.getState();
      switch (e.key) {
        case " ":
          e.preventDefault();
          s.togglePlay();
          break;
        case "ArrowRight":
          s.next();
          break;
        case "ArrowLeft":
          s.prev();
          break;
        case "m":
        case "M":
          s.toggleMute();
          break;
        case "l":
        case "L":
          s.cycleRepeat();
          break;
        case "s":
        case "S":
          s.toggleShuffle();
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}
