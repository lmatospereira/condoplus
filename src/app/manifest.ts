import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Zelora",
    short_name: "Zelora",
    description: "Zelora — Gestão que cuida de cada detalhe. Comunicados, reservas e moradores do seu condomínio.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    lang: "pt-BR",
    theme_color: "#203D50",
    background_color: "#f4f7f8",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
