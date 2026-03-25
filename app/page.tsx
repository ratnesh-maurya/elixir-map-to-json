"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { parseElixirValue } from "@/lib/elixir-parser";
import { jsonToElixirMap, KeyStyle } from "@/lib/json-to-elixir";
import { jsonToElixirStruct, Encoder } from "@/lib/json-to-struct";

// ──────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────

type Tool = "elixir-to-json" | "json-to-elixir" | "json-to-struct";

// ──────────────────────────────────────────────────────────────────
// Hooks
// ──────────────────────────────────────────────────────────────────

function useLocalStorage<T>(key: string, initial: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(initial);

  // Hydrate from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) setValue(JSON.parse(stored) as T);
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const set = useCallback(
    (next: T) => {
      setValue(next);
      try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* ignore */ }
    },
    [key]
  );

  return [value, set];
}

function useDebounce<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

function useTheme() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const themeRef = useRef<"dark" | "light">("dark");

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const sys = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    const t = (stored as "dark" | "light") || sys;
    themeRef.current = t;
    setTheme(t);
    document.documentElement.setAttribute("data-theme", t);
  }, []);

  const toggle = useCallback(() => {
    const next = themeRef.current === "dark" ? "light" : "dark";
    themeRef.current = next;
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  }, []);

  return { theme, toggle };
}

// ──────────────────────────────────────────────────────────────────
// Shared UI atoms
// ──────────────────────────────────────────────────────────────────

function CopyButton({ text, size = "sm" }: { text: string; size?: "sm" | "md" }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      disabled={!text}
      style={{
        background: copied ? "var(--success)" : "var(--surface-2)",
        border: "1px solid var(--border)",
        color: copied ? "#fff" : "var(--text-secondary)",
        padding: size === "md" ? "6px 16px" : "4px 12px",
        borderRadius: 6,
        fontSize: size === "md" ? 13 : 12,
        fontWeight: 500,
        cursor: text ? "pointer" : "not-allowed",
        opacity: text ? 1 : 0.4,
        transition: "all 0.15s ease",
        display: "flex",
        alignItems: "center",
        gap: 5,
        whiteSpace: "nowrap",
      }}
    >
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

function DownloadButton({ text, filename }: { text: string; filename: string }) {
  const download = useCallback(() => {
    if (!text) return;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [text, filename]);

  return (
    <button
      onClick={download}
      disabled={!text}
      title="Download as file"
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
        color: "var(--text-secondary)",
        padding: "4px 10px",
        borderRadius: 6,
        fontSize: 12,
        cursor: text ? "pointer" : "not-allowed",
        opacity: text ? 1 : 0.4,
        transition: "all 0.15s ease",
        display: "flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      ↓
    </button>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      style={{
        background: "var(--error-bg)",
        border: "1px solid var(--error)",
        borderRadius: 6,
        padding: "10px 14px",
        color: "var(--error)",
        fontSize: 13,
        fontFamily: "var(--font-mono, monospace)",
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
      }}
    >
      <span style={{ flexShrink: 0 }}>⚠</span>
      <span>{message}</span>
    </div>
  );
}

function SuccessBadge() {
  return (
    <span
      style={{
        background: "var(--success-bg)",
        color: "var(--success)",
        fontSize: 11,
        padding: "2px 8px",
        borderRadius: 4,
        fontWeight: 600,
      }}
    >
      ✓ converted
    </span>
  );
}

function PanelLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: "var(--text-secondary)",
        textTransform: "uppercase" as const,
        letterSpacing: "0.08em",
      }}
    >
      {children}
    </span>
  );
}

function Sel({
  label, value, onChange, options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-secondary)" }}>
      <span>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          color: "var(--text-primary)",
          padding: "3px 8px",
          borderRadius: 6,
          fontSize: 12,
          outline: "none",
          cursor: "pointer",
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

function Tog({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label
      onClick={() => onChange(!checked)}
      style={{
        display: "flex", alignItems: "center", gap: 7, fontSize: 12,
        color: "var(--text-secondary)", cursor: "pointer", userSelect: "none" as const,
      }}
    >
      <div
        style={{
          width: 30, height: 17, borderRadius: 9,
          background: checked ? "var(--accent)" : "var(--surface-3)",
          border: "1px solid var(--border)",
          position: "relative" as const,
          flexShrink: 0,
          transition: "background 0.15s ease",
        }}
      >
        <div style={{
          position: "absolute" as const,
          top: 2, left: checked ? 14 : 2, width: 11, height: 11,
          borderRadius: "50%", background: "white",
          transition: "left 0.15s ease",
        }} />
      </div>
      {label}
    </label>
  );
}

function ConvertBtn({ label, onClick }: { label?: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "var(--accent)",
        color: "white",
        border: "none",
        padding: "9px 28px",
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        transition: "opacity 0.15s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
    >
      {label ?? "Convert →"}
    </button>
  );
}

// Shared options bar wrapper
function OptionsBar({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 16,
      padding: "9px 14px",
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 8,
      flexWrap: "wrap" as const,
    }}>
      {children}
    </div>
  );
}

// Shared split editor
function EditorPair({
  inputLabel, inputValue, onInputChange, onPaste,
  outputLabel, outputValue, inputError, inputSuccess,
  inputPlaceholder, outputPlaceholder,
  inputActions, outputActions, inputHeight,
}: {
  inputLabel: string;
  inputValue: string;
  onInputChange: (v: string) => void;
  onPaste?: (v: string) => void;
  outputLabel: string;
  outputValue: string;
  inputError: boolean;
  inputSuccess: boolean;
  inputPlaceholder?: string;
  outputPlaceholder?: string;
  inputActions?: React.ReactNode;
  outputActions?: React.ReactNode;
  inputHeight?: number;
}) {
  const h = inputHeight ?? 380;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {/* Input */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: 24 }}>
          <PanelLabel>{inputLabel}</PanelLabel>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>{inputActions}</div>
        </div>
        <textarea
          className={`code-area${inputError ? " has-error" : inputSuccess ? " has-success" : ""}`}
          style={{ height: h }}
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onPaste={onPaste ? (e) => {
            e.preventDefault();
            const pasted = e.clipboardData.getData("text");
            onInputChange(pasted);
            onPaste(pasted);
          } : undefined}
          spellCheck={false}
          placeholder={inputPlaceholder}
          aria-label={inputLabel}
        />
      </div>

      {/* Output */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: 24 }}>
          <PanelLabel>{outputLabel}</PanelLabel>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>{outputActions}</div>
        </div>
        <textarea
          className={`code-area${outputValue && !inputError ? " has-success" : ""}`}
          style={{ height: h }}
          value={outputValue}
          readOnly
          placeholder={outputPlaceholder ?? "Output will appear here..."}
          aria-label={outputLabel}
        />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Share utility
// ──────────────────────────────────────────────────────────────────

function useShare(toolId: Tool, input: string) {
  const [shared, setShared] = useState(false);

  const share = useCallback(async () => {
    try {
      const encoded = btoa(encodeURIComponent(input));
      const url = `${window.location.origin}?t=${toolId}&i=${encoded}`;
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2500);
    } catch { /* ignore */ }
  }, [toolId, input]);

  return { share, shared };
}

function ShareButton({ toolId, input }: { toolId: Tool; input: string }) {
  const { share, shared } = useShare(toolId, input);
  return (
    <button
      onClick={share}
      disabled={!input}
      title="Copy shareable link"
      style={{
        background: shared ? "var(--accent-bg)" : "var(--surface-2)",
        border: `1px solid ${shared ? "var(--accent-light)" : "var(--border)"}`,
        color: shared ? "var(--accent-light)" : "var(--text-secondary)",
        padding: "4px 10px",
        borderRadius: 6,
        fontSize: 12,
        cursor: input ? "pointer" : "not-allowed",
        opacity: input ? 1 : 0.4,
        transition: "all 0.15s ease",
        display: "flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      {shared ? "✓ Link copied" : "Share"}
    </button>
  );
}

// ──────────────────────────────────────────────────────────────────
// Tool 1: Elixir → JSON
// ──────────────────────────────────────────────────────────────────

const ELIXIR_SAMPLE = `%{
  name: "Alice",
  age: 30,
  active: true,
  score: 9.8,
  tags: ["elixir", "phoenix"],
  address: %{
    city: "New York",
    zip: "10001"
  },
  status: :ok,
  metadata: nil,
  counts: {1, 2, 3}
}`;

function ElixirToJsonTool({ sharedInput }: { sharedInput?: string }) {
  const [input, setInput] = useLocalStorage("elx2json-input", ELIXIR_SAMPLE);
  const [indent, setIndent] = useLocalStorage("elx2json-indent", "2");
  const [liveMode, setLiveMode] = useLocalStorage("elx2json-live", false);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [converted, setConverted] = useState(false);

  // Apply shared URL input once
  useEffect(() => {
    if (sharedInput) {
      setInput(sharedInput);
    }
  }, [sharedInput, setInput]);

  const convert = useCallback((src: string, ind: string) => {
    const result = parseElixirValue(src);
    if (!result.success) {
      setError(result.error);
      setOutput("");
      setConverted(false);
      return;
    }
    try {
      const spaces = parseInt(ind, 10);
      setOutput(JSON.stringify(result.value, null, spaces || undefined));
      setError("");
      setConverted(true);
    } catch (e) {
      setError(`Serialization error: ${(e as Error).message}`);
      setConverted(false);
    }
  }, []);

  const debouncedInput = useDebounce(input, 350);
  useEffect(() => {
    if (liveMode && debouncedInput.trim()) convert(debouncedInput, indent);
  }, [liveMode, debouncedInput, indent, convert]);

  // Keyboard shortcut: Cmd/Ctrl+Enter
  const areaRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        convert(input, indent);
      }
    };
    el.addEventListener("keydown", handler);
    return () => el.removeEventListener("keydown", handler);
  }, [input, indent, convert]);

  return (
    <div ref={areaRef} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <OptionsBar>
        <Sel label="Indent" value={indent} onChange={setIndent}
          options={[{ value: "0", label: "Compact" }, { value: "2", label: "2 spaces" }, { value: "4", label: "4 spaces" }]}
        />
        <Tog label="Live" checked={liveMode} onChange={setLiveMode} />
        <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: "auto" }}>
          ⌘↩ to convert · atoms→strings · nil→null · tuples→arrays
        </span>
      </OptionsBar>

      <EditorPair
        inputLabel="Elixir Map"
        inputValue={input}
        onInputChange={(v) => { setInput(v); setConverted(false); setError(""); }}
        onPaste={(v) => { if (!liveMode) convert(v, indent); }}
        outputLabel="JSON Output"
        outputValue={output}
        inputError={!!error}
        inputSuccess={converted}
        inputPlaceholder={`%{key: "value", count: 42}`}
        outputPlaceholder="JSON will appear here..."
        inputActions={
          <>
            {converted && <SuccessBadge />}
            <button
              onClick={() => { setInput(""); setOutput(""); setError(""); setConverted(false); }}
              style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 12, cursor: "pointer", padding: "2px 6px" }}
            >
              Clear
            </button>
            <button
              onClick={() => setInput(ELIXIR_SAMPLE)}
              style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 12, cursor: "pointer", padding: "2px 6px" }}
            >
              Sample
            </button>
          </>
        }
        outputActions={
          <>
            <ShareButton toolId="elixir-to-json" input={input} />
            <DownloadButton text={output} filename="output.json" />
            <CopyButton text={output} />
          </>
        }
      />

      {error && <ErrorBanner message={error} />}

      {!liveMode && (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <ConvertBtn onClick={() => convert(input, indent)} />
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Tool 2: JSON → Elixir Map
// ──────────────────────────────────────────────────────────────────

const JSON_SAMPLE = `{
  "name": "Alice",
  "age": 30,
  "active": true,
  "score": 9.8,
  "tags": ["elixir", "phoenix"],
  "address": {
    "city": "New York",
    "zip": "10001"
  },
  "status": null
}`;

function JsonToElixirTool({ sharedInput }: { sharedInput?: string }) {
  const [input, setInput] = useLocalStorage("json2elx-input", JSON_SAMPLE);
  const [keyStyle, setKeyStyle] = useLocalStorage<KeyStyle>("json2elx-keystyle", "auto");
  const [indent, setIndent] = useLocalStorage("json2elx-indent", "2");
  const [liveMode, setLiveMode] = useLocalStorage("json2elx-live", false);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [converted, setConverted] = useState(false);

  useEffect(() => {
    if (sharedInput) setInput(sharedInput);
  }, [sharedInput, setInput]);

  const convert = useCallback((src: string, ks: KeyStyle, ind: string) => {
    const result = jsonToElixirMap(src, { keyStyle: ks, indent: parseInt(ind, 10) });
    if (!result.success) {
      setError(result.error); setOutput(""); setConverted(false);
    } else {
      setOutput(result.value); setError(""); setConverted(true);
    }
  }, []);

  const debouncedInput = useDebounce(input, 350);
  useEffect(() => {
    if (liveMode && debouncedInput.trim()) convert(debouncedInput, keyStyle, indent);
  }, [liveMode, debouncedInput, keyStyle, indent, convert]);

  const areaRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); convert(input, keyStyle, indent); }
    };
    el.addEventListener("keydown", handler);
    return () => el.removeEventListener("keydown", handler);
  }, [input, keyStyle, indent, convert]);

  const formatJson = useCallback(() => {
    try { setInput(JSON.stringify(JSON.parse(input), null, 2)); } catch { /* ignore */ }
  }, [input, setInput]);

  return (
    <div ref={areaRef} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <OptionsBar>
        <Sel label="Keys" value={keyStyle} onChange={(v) => setKeyStyle(v as KeyStyle)}
          options={[
            { value: "auto", label: "Auto (atom when valid)" },
            { value: "atom", label: "Always atom (key:)" },
            { value: "string", label: "Always string (\"key\" =>)" },
          ]}
        />
        <Sel label="Indent" value={indent} onChange={setIndent}
          options={[{ value: "0", label: "Compact" }, { value: "2", label: "2 spaces" }, { value: "4", label: "4 spaces" }]}
        />
        <Tog label="Live" checked={liveMode} onChange={setLiveMode} />
        <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: "auto" }}>⌘↩ to convert</span>
      </OptionsBar>

      <EditorPair
        inputLabel="JSON Input"
        inputValue={input}
        onInputChange={(v) => { setInput(v); setConverted(false); setError(""); }}
        onPaste={(v) => { if (!liveMode) convert(v, keyStyle, indent); }}
        outputLabel="Elixir Map Output"
        outputValue={output}
        inputError={!!error}
        inputSuccess={converted}
        inputPlaceholder={`{"key": "value", "count": 42}`}
        outputPlaceholder="Elixir map will appear here..."
        inputActions={
          <>
            {converted && <SuccessBadge />}
            <button
              onClick={formatJson}
              title="Pretty-print JSON"
              style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 12, cursor: "pointer", padding: "2px 6px" }}
            >
              Format
            </button>
            <button
              onClick={() => { setInput(""); setOutput(""); setError(""); setConverted(false); }}
              style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 12, cursor: "pointer", padding: "2px 6px" }}
            >
              Clear
            </button>
            <button
              onClick={() => setInput(JSON_SAMPLE)}
              style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 12, cursor: "pointer", padding: "2px 6px" }}
            >
              Sample
            </button>
          </>
        }
        outputActions={
          <>
            <ShareButton toolId="json-to-elixir" input={input} />
            <DownloadButton text={output} filename="output.ex" />
            <CopyButton text={output} />
          </>
        }
      />

      {error && <ErrorBanner message={error} />}

      {!liveMode && (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <ConvertBtn onClick={() => convert(input, keyStyle, indent)} />
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Tool 3: JSON → Elixir Struct
// ──────────────────────────────────────────────────────────────────

const STRUCT_SAMPLE = `{
  "name": "Alice",
  "age": 30,
  "active": true,
  "score": 9.8,
  "address": {
    "city": "New York",
    "zipCode": "10001"
  }
}`;

function JsonToStructTool({ sharedInput }: { sharedInput?: string }) {
  const [input, setInput] = useLocalStorage("json2struct-input", STRUCT_SAMPLE);
  const [moduleName, setModuleName] = useLocalStorage("json2struct-module", "MyApp.User");
  const [encoder, setEncoder] = useLocalStorage<Encoder>("json2struct-encoder", "jason");
  const [genTypes, setGenTypes] = useLocalStorage("json2struct-types", true);
  const [genFromJson, setGenFromJson] = useLocalStorage("json2struct-fromjson", true);
  const [genToJson, setGenToJson] = useLocalStorage("json2struct-tojson", false);
  const [liveMode, setLiveMode] = useLocalStorage("json2struct-live", false);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [converted, setConverted] = useState(false);

  useEffect(() => {
    if (sharedInput) setInput(sharedInput);
  }, [sharedInput, setInput]);

  const convert = useCallback((src: string, mod: string, enc: Encoder, gt: boolean, gf: boolean, gtj: boolean) => {
    const result = jsonToElixirStruct(src, {
      moduleName: mod || "MyModule",
      encoder: enc,
      generateTypes: gt,
      generateFromJson: gf,
      generateToJson: gtj,
    });
    if (!result.success) {
      setError(result.error); setOutput(""); setConverted(false);
    } else {
      setOutput(result.value); setError(""); setConverted(true);
    }
  }, []);

  const debouncedInput = useDebounce(input, 400);
  useEffect(() => {
    if (liveMode && debouncedInput.trim())
      convert(debouncedInput, moduleName, encoder, genTypes, genFromJson, genToJson);
  }, [liveMode, debouncedInput, moduleName, encoder, genTypes, genFromJson, genToJson, convert]);

  const areaRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        convert(input, moduleName, encoder, genTypes, genFromJson, genToJson);
      }
    };
    el.addEventListener("keydown", handler);
    return () => el.removeEventListener("keydown", handler);
  }, [input, moduleName, encoder, genTypes, genFromJson, genToJson, convert]);

  const formatJson = useCallback(() => {
    try { setInput(JSON.stringify(JSON.parse(input), null, 2)); } catch { /* ignore */ }
  }, [input, setInput]);

  return (
    <div ref={areaRef} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <OptionsBar>
        {/* Module name */}
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-secondary)" }}>
          Module
          <input
            value={moduleName}
            onChange={(e) => setModuleName(e.target.value)}
            style={{
              background: "var(--surface-2)", border: "1px solid var(--border)",
              color: "var(--text-primary)", padding: "3px 10px",
              borderRadius: 6, fontSize: 12, outline: "none",
              fontFamily: "var(--font-mono, monospace)", width: 150,
            }}
            placeholder="MyApp.User"
            spellCheck={false}
          />
        </label>
        <Sel label="Encoder" value={encoder} onChange={(v) => setEncoder(v as Encoder)}
          options={[{ value: "jason", label: "Jason" }, { value: "poison", label: "Poison" }, { value: "none", label: "None" }]}
        />
        <div style={{ width: 1, height: 18, background: "var(--border)", flexShrink: 0 }} />
        <Tog label="@type" checked={genTypes} onChange={setGenTypes} />
        <Tog label="from_json" checked={genFromJson} onChange={setGenFromJson} />
        <Tog label="to_json_map" checked={genToJson} onChange={setGenToJson} />
        <Tog label="Live" checked={liveMode} onChange={setLiveMode} />
      </OptionsBar>

      <EditorPair
        inputLabel="JSON Input"
        inputValue={input}
        onInputChange={(v) => { setInput(v); setConverted(false); setError(""); }}
        onPaste={(v) => { if (!liveMode) convert(v, moduleName, encoder, genTypes, genFromJson, genToJson); }}
        outputLabel="Elixir Struct"
        outputValue={output}
        inputError={!!error}
        inputSuccess={converted}
        inputPlaceholder={`{"name": "Alice", "age": 30}`}
        outputPlaceholder="defmodule code will appear here..."
        inputHeight={430}
        inputActions={
          <>
            {converted && <SuccessBadge />}
            <button onClick={formatJson}
              style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 12, cursor: "pointer", padding: "2px 6px" }}>
              Format
            </button>
            <button onClick={() => { setInput(""); setOutput(""); setError(""); setConverted(false); }}
              style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 12, cursor: "pointer", padding: "2px 6px" }}>
              Clear
            </button>
            <button onClick={() => setInput(STRUCT_SAMPLE)}
              style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 12, cursor: "pointer", padding: "2px 6px" }}>
              Sample
            </button>
          </>
        }
        outputActions={
          <>
            <ShareButton toolId="json-to-struct" input={input} />
            <DownloadButton text={output} filename={`${(moduleName || "module").toLowerCase().replace(/\./g, "_")}.ex`} />
            <CopyButton text={output} />
          </>
        }
      />

      {error && <ErrorBanner message={error} />}

      {!liveMode && (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <ConvertBtn label="Generate →" onClick={() => convert(input, moduleName, encoder, genTypes, genFromJson, genToJson)} />
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Theme toggle button
// ──────────────────────────────────────────────────────────────────

function ThemeToggle({ theme, toggle }: { theme: "dark" | "light"; toggle: () => void }) {
  return (
    <button
      onClick={toggle}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        width: 34,
        height: 34,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        fontSize: 16,
        transition: "background 0.15s ease",
        flexShrink: 0,
      }}
    >
      {theme === "dark" ? "☀" : "🌙"}
    </button>
  );
}

// ──────────────────────────────────────────────────────────────────
// Syntax reference
// ──────────────────────────────────────────────────────────────────

const SYNTAX_EXAMPLES = [
  { title: "Atom shorthand", code: `%{name: "Alice", age: 30}` },
  { title: "String keys", code: `%{"name" => "Alice"}` },
  { title: "Explicit atoms", code: `%{:name => "Alice"}` },
  { title: "Atom values", code: `%{status: :ok, err: :not_found}` },
  { title: "Nil / Boolean", code: `%{active: true, data: nil}` },
  { title: "Nested maps", code: `%{user: %{name: "Alice"}}` },
  { title: "Lists", code: `%{tags: ["a", "b", "c"]}` },
  { title: "Tuples → arrays", code: `%{result: {:ok, "value"}}` },
  { title: "Number literals", code: `%{big: 1_000_000, pi: 3.14}` },
];

// ──────────────────────────────────────────────────────────────────
// Main page
// ──────────────────────────────────────────────────────────────────

const TOOLS = [
  { id: "elixir-to-json" as Tool, label: "Elixir → JSON", hint: "Parse Elixir map syntax and convert to JSON" },
  { id: "json-to-elixir" as Tool, label: "JSON → Elixir", hint: "Convert JSON to Elixir map (atom keys, string keys, or auto)" },
  { id: "json-to-struct" as Tool, label: "JSON → Struct", hint: "Generate Elixir defstruct modules with types and conversion helpers" },
];

export default function Home() {
  const [activeTool, setActiveTool] = useLocalStorage<Tool>("active-tool", "elixir-to-json");
  const { theme, toggle: toggleTheme } = useTheme();
  const [sharedState, setSharedState] = useState<{ tool: Tool; input: string } | null>(null);

  // Read URL share params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("t") as Tool | null;
    const i = params.get("i");
    if (t && i && TOOLS.some((x) => x.id === t)) {
      try {
        const decoded = decodeURIComponent(atob(i));
        setActiveTool(t);
        setSharedState({ tool: t, input: decoded });
        // Clean URL without reload
        window.history.replaceState({}, "", window.location.pathname);
      } catch { /* ignore */ }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sharedInput = (tool: Tool) =>
    sharedState?.tool === tool ? sharedState.input : undefined;

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", display: "flex", flexDirection: "column" }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <header style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, background: "var(--accent)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>
              ⚗
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                Elixir ↔ JSON
              </div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", lineHeight: 1 }}>Map · Struct Converter</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-muted)" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--success)", display: "inline-block" }} />
              100% browser · no server
            </div>
            <ThemeToggle theme={theme} toggle={toggleTheme} />
          </div>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────── */}
      <main style={{ flex: 1, maxWidth: 1280, margin: "0 auto", width: "100%", padding: "24px 24px 56px" }}>

        {/* Hero */}
        <div style={{ marginBottom: 24, textAlign: "center" }}>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em", marginBottom: 8, lineHeight: 1.1 }}>
            Elixir ↔ JSON Converter
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", maxWidth: 560, margin: "0 auto", lineHeight: 1.65 }}>
            The only browser-based tool that converts native Elixir map syntax to JSON — and back.
            Your last input is automatically saved.
          </p>
        </div>

        {/* Tab bar */}
        <div
          role="tablist"
          style={{ display: "flex", gap: 4, marginBottom: 20, background: "var(--surface)", padding: 4, borderRadius: 10, border: "1px solid var(--border)" }}
        >
          {TOOLS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={activeTool === t.id}
              onClick={() => setActiveTool(t.id)}
              style={{
                flex: 1,
                padding: "8px 14px",
                borderRadius: 7,
                border: "none",
                background: activeTool === t.id ? "var(--accent)" : "transparent",
                color: activeTool === t.id ? "white" : "var(--text-secondary)",
                fontSize: 13,
                fontWeight: activeTool === t.id ? 600 : 400,
                cursor: "pointer",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap" as const,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Active tab hint */}
        <p style={{ marginBottom: 16, fontSize: 13, color: "var(--text-secondary)" }}>
          {TOOLS.find((t) => t.id === activeTool)?.hint}
        </p>

        {/* Tool panels */}
        {activeTool === "elixir-to-json" && <ElixirToJsonTool sharedInput={sharedInput("elixir-to-json")} />}
        {activeTool === "json-to-elixir" && <JsonToElixirTool sharedInput={sharedInput("json-to-elixir")} />}
        {activeTool === "json-to-struct" && <JsonToStructTool sharedInput={sharedInput("json-to-struct")} />}

        {/* Syntax reference */}
        <details style={{ marginTop: 40, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 16px" }}>
          <summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", userSelect: "none" as const, listStyle: "none" }}>
            📖 Elixir Map Syntax Reference &nbsp;<span style={{ color: "var(--text-muted)", fontWeight: 400 }}>— click to expand</span>
          </summary>
          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {SYNTAX_EXAMPLES.map((ex) => (
              <div key={ex.title}>
                <div style={{ color: "var(--text-muted)", marginBottom: 4, fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
                  {ex.title}
                </div>
                <code style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 12, color: "var(--accent-light)", background: "var(--surface-2)", padding: "5px 10px", borderRadius: 5, display: "block", lineHeight: 1.5 }}>
                  {ex.code}
                </code>
              </div>
            ))}
          </div>
        </details>

        {/* FAQ (hidden, but in DOM for SEO) */}
        <section aria-label="Frequently asked questions" style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12, letterSpacing: "-0.02em" }}>FAQ</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { q: "What Elixir map syntax is supported?", a: "All common forms: atom shorthand (%{key: value}), string keys (%{\"key\" => value}), explicit atom keys (%{:key => value}), nested maps, lists, tuples, atoms (:ok, :error), nil, true, false, and numeric literals including 1_000_000 separators." },
              { q: "How are Elixir atoms converted to JSON?", a: "Atoms are converted to their string name. :ok → \"ok\", :not_found → \"not_found\". The special atoms nil, true, and false become JSON null, true, and false." },
              { q: "Does data leave my browser?", a: "No. All conversion runs in JavaScript in your browser tab. Nothing is sent to any server. Your inputs are saved locally in your browser's localStorage." },
              { q: "What does the JSON → Struct tool generate?", a: "A complete defmodule with defstruct, optional @type t() typespecs, from_json/1 for constructing the struct from parsed JSON, and optionally to_json_map/1 for the reverse. Nested JSON objects become nested modules." },
            ].map(({ q, a }) => (
              <details key={q} style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 7, padding: "10px 14px" }}>
                <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: 14, color: "var(--text-primary)", listStyle: "none" as const, userSelect: "none" as const }}>{q}</summary>
                <p style={{ marginTop: 8, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.65 }}>{a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 8, fontSize: 12, color: "var(--text-muted)" }}>
        <span>
          Built by{" "}
          <a href="https://www.ratnesh-maurya.com" target="_blank" rel="noopener noreferrer"
            style={{ color: "var(--accent-light)", textDecoration: "none" }}>
            Ratnesh Maurya
          </a>
          {" "}·{" "}
          <a href="https://twitter.com/ratnesh_maurya_" target="_blank" rel="noopener noreferrer"
            style={{ color: "var(--accent-light)", textDecoration: "none" }}>
            @ratnesh_maurya_
          </a>
        </span>
        <span>No data sent to any server · Open source</span>
      </footer>
    </div>
  );
}
