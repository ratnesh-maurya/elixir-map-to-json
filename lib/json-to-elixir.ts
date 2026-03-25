// Convert JSON (parsed or string) to Elixir map syntax

export type KeyStyle = "atom" | "string" | "auto";

export interface JsonToElixirOptions {
  keyStyle: KeyStyle;
  indent: number; // 0 = compact, 2 = pretty
  atomKeys: boolean; // kept for compat, use keyStyle
}

function isValidAtomKey(key: string): boolean {
  // Valid as unquoted atom shorthand: starts with lowercase or _, alphanumeric + _ ! ?
  return /^[a-z_][a-zA-Z0-9_!?]*$/.test(key);
}

function escapeElixirString(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\t/g, "\\t")
    .replace(/\r/g, "\\r");
}

function valueToElixir(
  value: unknown,
  opts: JsonToElixirOptions,
  depth: number
): string {
  const pad = " ".repeat(opts.indent);
  const indent = pad.repeat(depth);
  const innerIndent = pad.repeat(depth + 1);
  const nl = opts.indent > 0 ? "\n" : "";
  const sp = opts.indent > 0 ? " " : " ";

  if (value === null) return "nil";
  if (typeof value === "boolean") return String(value);
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return `"${escapeElixirString(value)}"`;

  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const items = value.map((item) =>
      opts.indent > 0
        ? `${innerIndent}${valueToElixir(item, opts, depth + 1)}`
        : valueToElixir(item, opts, depth + 1)
    );
    if (opts.indent > 0) {
      return `[${nl}${items.join(`,${nl}`)}${nl}${indent}]`;
    }
    return `[${items.join(", ")}]`;
  }

  if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return "%{}";

    const pairs = entries.map(([k, v]) => {
      const key = formatKey(k, opts.keyStyle);
      const val = valueToElixir(v, opts, depth + 1);
      const pair =
        key.endsWith(":") ? `${key}${sp}${val}` : `${key}${sp}=>${sp}${val}`;
      return opts.indent > 0 ? `${innerIndent}${pair}` : pair;
    });

    if (opts.indent > 0) {
      return `%{${nl}${pairs.join(`,${nl}`)}${nl}${indent}}`;
    }
    return `%{${pairs.join(", ")}}`;
  }

  return String(value);
}

function formatKey(key: string, style: KeyStyle): string {
  const valid = isValidAtomKey(key);

  if (style === "atom") {
    if (valid) return `${key}:`; // shorthand: key:
    return `:"${escapeElixirString(key)}" =>`; // quoted atom
  }

  if (style === "string") {
    return `"${escapeElixirString(key)}" =>`; // string key
  }

  // auto: prefer atom shorthand when valid
  if (valid) return `${key}:`;
  return `"${escapeElixirString(key)}" =>`;
}

export type ConvertResult =
  | { success: true; value: string }
  | { success: false; error: string };

export function jsonToElixirMap(
  jsonInput: string,
  options: Partial<JsonToElixirOptions> = {}
): ConvertResult {
  const opts: JsonToElixirOptions = {
    keyStyle: options.keyStyle ?? "auto",
    indent: options.indent ?? 2,
    atomKeys: options.atomKeys ?? true,
  };

  try {
    const parsed = JSON.parse(jsonInput);
    const result = valueToElixir(parsed, opts, 0);
    return { success: true, value: result };
  } catch (e) {
    return { success: false, error: `Invalid JSON: ${(e as Error).message}` };
  }
}
