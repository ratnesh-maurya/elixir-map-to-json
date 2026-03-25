import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// ── SEO ─────────────────────────────────────────────────────────────────────
const SITE_URL = "https://elixir.ratnesh-maurya.com";
const SITE_NAME = "Elixir ↔ JSON Converter";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Elixir ↔ JSON — Free Map & Struct Converter",
    template: "%s | Elixir ↔ JSON",
  },
  description:
    "Convert Elixir maps to JSON, JSON to Elixir maps, and JSON to defstruct — all in your browser. Supports atom keys, string keys, nested maps, tuples, atoms, nil. Free, no sign-up.",
  keywords: [
    "elixir map to json",
    "json to elixir map",
    "elixir map converter",
    "elixir json online",
    "elixir defstruct generator",
    "json to elixir struct",
    "elixir map syntax",
    "elixir developer tools",
    "parse elixir map browser",
    "elixir atom keys json",
  ],
  authors: [{ name: "Ratnesh Maurya", url: "https://www.ratnesh-maurya.com" }],
  creator: "Ratnesh Maurya",
  publisher: "Ratnesh Maurya",
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "Elixir ↔ JSON — Free Map & Struct Converter",
    description:
      "The only browser-based tool that converts native Elixir map syntax (%{key: val}) to JSON — and back. Also generates defstruct modules. No signup, no server.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Elixir ↔ JSON Converter" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Elixir ↔ JSON — Free Map & Struct Converter",
    description:
      "Convert Elixir maps ↔ JSON and generate defstruct modules. Runs 100% in your browser. Free tool by @ratnesh_maurya_",
    creator: "@ratnesh_maurya_",
    site: "@ratnesh_maurya_",
    images: ["/opengraph-image"],
  },
  other: {
    "theme-color": "#7c3aed",
  },
};

// ── Structured data ──────────────────────────────────────────────────────────
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": `${SITE_URL}/#app`,
      name: SITE_NAME,
      url: SITE_URL,
      description: "Convert Elixir maps to JSON and JSON to Elixir maps or structs. Runs entirely in the browser.",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Any",
      browserRequirements: "Requires JavaScript",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      author: {
        "@type": "Person",
        name: "Ratnesh Maurya",
        url: "https://www.ratnesh-maurya.com",
        sameAs: ["https://twitter.com/ratnesh_maurya_", "https://github.com/ratnesh-maurya"],
      },
      featureList: [
        "Convert Elixir map syntax to JSON",
        "Convert JSON to Elixir map with atom or string keys",
        "Generate Elixir defstruct from JSON schema",
        "Supports nested maps, lists, tuples, atoms, nil",
        "Light and dark theme",
        "Data persisted in browser localStorage",
        "Keyboard shortcuts",
        "Download output as file",
      ],
      aggregateRating: { "@type": "AggregateRating", ratingValue: "5", ratingCount: "1" },
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/#faq`,
      mainEntity: [
        {
          "@type": "Question",
          name: "What Elixir map syntax is supported?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "All common Elixir map forms: atom shorthand (%{key: value}), string keys (%{\"key\" => value}), explicit atom keys (%{:key => value}), nested maps, lists, tuples, atoms (:ok, :error), nil, true, false, and numeric literals.",
          },
        },
        {
          "@type": "Question",
          name: "Does data leave my browser?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. All conversion happens entirely in JavaScript running in your browser. No data is sent to any server.",
          },
        },
        {
          "@type": "Question",
          name: "How are Elixir atoms converted to JSON?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Atoms are converted to their string representation. :ok becomes \"ok\", :error becomes \"error\". The special atoms nil, true, and false become JSON null, true, and false respectively.",
          },
        },
        {
          "@type": "Question",
          name: "What does the JSON to Struct tool generate?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "It generates a complete Elixir defmodule with defstruct, @type t() typespecs, a from_json/1 function to construct the struct from a parsed JSON map, and optionally a to_json_map/1 function. Nested objects become nested modules.",
          },
        },
        {
          "@type": "Question",
          name: "Is there a limit on input size?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "There is no enforced limit. Conversion happens locally in your browser, so performance depends on your device. Very large inputs (>1MB) may be slow.",
          },
        },
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      publisher: { "@id": `${SITE_URL}/#app` },
    },
  ],
};

// ── Layout ───────────────────────────────────────────────────────────────────
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        {/* Theme initialisation — must run before first paint to avoid flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme')||(window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
        {/* Favicons */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="alternate icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        {/* Structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
