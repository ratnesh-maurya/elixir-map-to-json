import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Elixir ↔ JSON Converter",
    short_name: "Elixir JSON",
    description:
      "Convert Elixir maps to JSON, JSON to Elixir maps, and JSON to defstruct — all in your browser.",
    start_url: "/",
    display: "standalone",
    background_color: "#0d1117",
    theme_color: "#7c3aed",
    icons: [
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
      { src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
    categories: ["developer tools", "utilities", "productivity"],
    lang: "en",
  };
}
