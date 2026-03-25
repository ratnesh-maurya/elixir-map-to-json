// Convert JSON object to Elixir defstruct module definitions

export type Encoder = "jason" | "poison" | "none";

export interface StructOptions {
  moduleName: string;
  generateTypes: boolean;
  generateFromJson: boolean;
  generateToJson: boolean;
  encoder: Encoder;
}

// ────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────

function toPascalCase(str: string): string {
  return str
    .replace(/[-_ ](.)/g, (_, c: string) => c.toUpperCase())
    .replace(/^(.)/, (c: string) => c.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, "");
}

function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, "_$1")
    .toLowerCase()
    .replace(/^_/, "")
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/__+/g, "_")
    .replace(/_$/, "");
}

function inferElixirType(value: unknown, key: string): string {
  if (value === null) return "nil | any()";
  if (typeof value === "boolean") return "boolean()";
  if (typeof value === "number")
    return Number.isInteger(value) ? "integer()" : "float()";
  if (typeof value === "string") return "String.t()";
  if (Array.isArray(value)) {
    if (value.length > 0) return `list(${inferElixirType(value[0], key)})`;
    return "list()";
  }
  if (typeof value === "object") {
    return `${toPascalCase(key)}.t()`;
  }
  return "any()";
}

function defaultValue(value: unknown): string {
  if (value === null) return "nil";
  if (typeof value === "boolean") return String(value);
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return "nil";
  if (Array.isArray(value)) return "[]";
  if (typeof value === "object") return "nil";
  return "nil";
}

// ────────────────────────────────────────────────
// Recursive struct generator
// ────────────────────────────────────────────────

function generateStructModule(
  obj: Record<string, unknown>,
  moduleName: string,
  opts: StructOptions,
  accumulatedModules: string[]
): void {
  const entries = Object.entries(obj);
  const lines: string[] = [];

  // Generate nested modules first (depth-first so inner modules appear before outer)
  for (const [key, value] of entries) {
    if (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.keys(value as object).length > 0
    ) {
      generateStructModule(
        value as Record<string, unknown>,
        `${moduleName}.${toPascalCase(key)}`,
        opts,
        accumulatedModules
      );
    }
  }

  // Module header
  lines.push(`defmodule ${moduleName} do`);

  // @derive encoder
  if (opts.encoder === "jason") {
    lines.push(`  @derive [Jason.Encoder]`);
    lines.push("");
  } else if (opts.encoder === "poison") {
    lines.push(`  @derive [Poison.Encoder]`);
    lines.push("");
  }

  // @type t()
  if (opts.generateTypes) {
    lines.push(`  @type t :: %__MODULE__{`);
    for (const [key, value] of entries) {
      const snakeKey = toSnakeCase(key);
      const type = inferElixirType(value, key);
      lines.push(`    ${snakeKey}: ${type},`);
    }
    // Remove trailing comma from last line
    if (lines[lines.length - 1].endsWith(",")) {
      lines[lines.length - 1] = lines[lines.length - 1].slice(0, -1);
    }
    lines.push(`  }`);
    lines.push("");
  }

  // defstruct
  lines.push(`  defstruct [`);
  for (let i = 0; i < entries.length; i++) {
    const [key, value] = entries[i];
    const snakeKey = toSnakeCase(key);
    const def = defaultValue(value);
    const comma = i < entries.length - 1 ? "," : "";
    lines.push(`    ${snakeKey}: ${def}${comma}`);
  }
  lines.push(`  ]`);

  // from_json/1
  if (opts.generateFromJson) {
    lines.push("");
    lines.push(`  @spec from_json(map()) :: t() | nil`);
    lines.push(`  def from_json(nil), do: nil`);
    lines.push("");
    lines.push(`  def from_json(map) when is_map(map) do`);
    lines.push(`    %__MODULE__{`);
    for (let i = 0; i < entries.length; i++) {
      const [key, value] = entries[i];
      const snakeKey = toSnakeCase(key);
      const comma = i < entries.length - 1 ? "," : "";
      if (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value)
      ) {
        const nestedMod = `${moduleName}.${toPascalCase(key)}`;
        lines.push(
          `      ${snakeKey}: ${nestedMod}.from_json(map["${key}"])${comma}`
        );
      } else {
        lines.push(`      ${snakeKey}: map["${key}"]${comma}`);
      }
    }
    lines.push(`    }`);
    lines.push(`  end`);
  }

  // to_json_map/1
  if (opts.generateToJson) {
    lines.push("");
    lines.push(`  @spec to_json_map(t()) :: map()`);
    lines.push(`  def to_json_map(%__MODULE__{} = s) do`);
    lines.push(`    %{`);
    for (let i = 0; i < entries.length; i++) {
      const [key, value] = entries[i];
      const snakeKey = toSnakeCase(key);
      const comma = i < entries.length - 1 ? "," : "";
      if (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value)
      ) {
        const nestedMod = `${moduleName}.${toPascalCase(key)}`;
        lines.push(
          `      "${key}" => ${nestedMod}.to_json_map(s.${snakeKey})${comma}`
        );
      } else {
        lines.push(`      "${key}" => s.${snakeKey}${comma}`);
      }
    }
    lines.push(`    }`);
    lines.push(`  end`);
  }

  lines.push(`end`);

  accumulatedModules.push(lines.join("\n"));
}

// ────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────

export type ConvertResult =
  | { success: true; value: string }
  | { success: false; error: string };

export function jsonToElixirStruct(
  jsonInput: string,
  options: Partial<StructOptions> = {}
): ConvertResult {
  const opts: StructOptions = {
    moduleName: options.moduleName || "MyModule",
    generateTypes: options.generateTypes ?? true,
    generateFromJson: options.generateFromJson ?? true,
    generateToJson: options.generateToJson ?? false,
    encoder: options.encoder ?? "jason",
  };

  try {
    const parsed = JSON.parse(jsonInput);

    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return {
        success: false,
        error:
          "Input must be a JSON object (not an array or primitive value). Wrap your array in an object if needed.",
      };
    }

    const modules: string[] = [];
    generateStructModule(
      parsed as Record<string, unknown>,
      opts.moduleName,
      opts,
      modules
    );

    return { success: true, value: modules.join("\n\n") };
  } catch (e) {
    return {
      success: false,
      error: `Invalid JSON: ${(e as Error).message}`,
    };
  }
}
