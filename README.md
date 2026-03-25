# Elixir ↔ JSON Converter

> The only browser-based tool that converts native Elixir map syntax to JSON — and back.

**Live →** <https://elixir.ratnesh-maurya.com>

---

## Tools

| Tool                  | Direction                                 | Description                                                     |
| --------------------- | ----------------------------------------- | --------------------------------------------------------------- |
| **Elixir Map → JSON** | `%{key: "val"}` → `{"key":"val"}`         | Parse any Elixir map/list/tuple and convert to JSON             |
| **JSON → Elixir Map** | `{"key":"val"}` → `%{key: "val"}`         | Convert JSON to Elixir map with atom keys, string keys, or auto |
| **JSON → Struct**     | `{"name":"Alice"}` → `defstruct`          | Generate complete `defmodule` with typespecs and helpers        |

## Features

- **Elixir syntax support** — atom shorthand, string keys, explicit atom keys, nested maps, lists, tuples, `:atoms`, `nil`, `true`, `false`, numeric separators (`1_000_000`)
- **Live mode** — debounced auto-convert as you type
- **Auto-convert on paste** — paste and it converts immediately
- **Keyboard shortcut** — `⌘ Enter` / `Ctrl Enter` to convert
- **Data persistence** — last input per tool is saved in `localStorage` and restored on every visit
- **URL sharing** — click Share to copy a link that pre-fills the tool with your input
- **Download** — save output as `.json` or `.ex` file
- **Light & dark theme** — respects system preference, persisted in `localStorage`
- **Format JSON** — pretty-print messy JSON input before converting
- **100% client-side** — no server, no network calls, works offline

## Struct generator options

- Choose module name (e.g. `MyApp.User`)
- Choose encoder: Jason (default) · Poison · None
- Toggle `@type t()` typespecs
- Toggle `from_json/1` constructor
- Toggle `to_json_map/1` serialiser
- Nested JSON objects become nested modules automatically

## Development

```bash
npm install
npm run dev
# open http://localhost:3000
```

```bash
npm run build   # production build
npm run lint    # lint
```

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com)
- **Zero runtime dependencies** — custom recursive-descent Elixir parser written in TypeScript
- Fully static — no server-side code, no API routes

## Project structure

```text
app/
  page.tsx              ← "use client" page with all three tools
  layout.tsx            ← SEO metadata + theme init script
  globals.css           ← CSS variables (dark + light)
  opengraph-image.tsx   ← OG image (Next.js ImageResponse)
  icon.tsx              ← Favicon (Next.js ImageResponse)
  manifest.ts           ← PWA manifest
lib/
  elixir-parser.ts      ← Recursive-descent parser for Elixir syntax
  json-to-elixir.ts     ← JSON → Elixir map converter
  json-to-struct.ts     ← JSON → defstruct generator
public/
  favicon.svg           ← SVG favicon
```

## How the Elixir parser works

The parser in [lib/elixir-parser.ts](lib/elixir-parser.ts) is a hand-written **recursive-descent parser** that:

1. Tokenises character-by-character (no regex for structure)
2. Handles all Elixir value types: maps (`%{}`), lists (`[]`), tuples (`{}`), strings (`""`), charlists (`''`), atoms (`:ok`), booleans, nil, integers, floats, hex/octal/binary literals
3. Strips Elixir comments (`# ...`)
4. Returns structured errors with position info

## Built by

[Ratnesh Maurya](https://www.ratnesh-maurya.com) · [@ratnesh_maurya_](https://twitter.com/ratnesh_maurya_)

---

*Part of the [ratnesh-maurya.com](https://www.ratnesh-maurya.com) developer tools collection.*
