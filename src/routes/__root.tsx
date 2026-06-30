import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import appCss from "../styles.css?url";
import { AppShell } from "@/components/AppShell";
import { Player } from "@/components/Player";
import { useGlobalShortcuts } from "@/lib/shortcuts";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#0f0a1e" },
      { title: "Norti Play — Sua música, sem limites" },
      { name: "description", content: "Player musical premium para suas músicas e playlists do YouTube." },
      { property: "og:title", content: "Norti Play" },
      { property: "og:description", content: "Player musical premium com glassmorphism e aurora gradients." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useGlobalShortcuts();

useEffect(() => {
  const savedColor = localStorage.getItem("nortiplay:brand-color");
  if (!savedColor) return;

  const hex = savedColor.startsWith("#") ? savedColor : `#${savedColor}`;

  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  const textColor = luminance > 0.62 ? "#111111" : "#ffffff";

  const root = document.documentElement;

  root.style.setProperty("--brand", hex);
  root.style.setProperty("--text-on-brand", textColor);
}, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppShell>
        <Outlet />
      </AppShell>
      <Player />
    </QueryClientProvider>
  );
}
