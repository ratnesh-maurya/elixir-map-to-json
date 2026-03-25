// Elixir map syntax parser - runs fully client-side in the browser

export class ElixirParseError extends Error {
  constructor(
    message: string,
    public position: number
  ) {
    super(message);
    this.name = "ElixirParseError";
  }
}

class ElixirParser {
  private pos: number = 0;

  constructor(private input: string) {}

  private peek(): string | undefined {
    return this.input[this.pos];
  }

  private peekAt(offset: number): string | undefined {
    return this.input[this.pos + offset];
  }

  private consume(): string {
    const ch = this.input[this.pos];
    if (ch === undefined) {
      throw new ElixirParseError("Unexpected end of input", this.pos);
    }
    this.pos++;
    return ch;
  }

  private expect(ch: string): void {
    const actual = this.consume();
    if (actual !== ch) {
      throw new ElixirParseError(
        `Expected '${ch}' but got '${actual}'`,
        this.pos - 1
      );
    }
  }

  private skipWhitespace(): void {
    while (this.pos < this.input.length) {
      const ch = this.input[this.pos];
      if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
        this.pos++;
      } else if (ch === "#") {
        // Elixir comment - skip to end of line
        while (this.pos < this.input.length && this.input[this.pos] !== "\n") {
          this.pos++;
        }
      } else {
        break;
      }
    }
  }

  parseValue(): unknown {
    this.skipWhitespace();
    const ch = this.peek();

    if (ch === undefined) {
      throw new ElixirParseError("Unexpected end of input", this.pos);
    }

    // Map: %{...}
    if (ch === "%" && this.peekAt(1) === "{") {
      return this.parseMap();
    }

    // Struct: %ModuleName{...} or %__MODULE__{...}
    if (ch === "%" && this.peekAt(1) !== "{") {
      return this.parseStruct();
    }

    // List: [...]
    if (ch === "[") {
      return this.parseList();
    }

    // Tuple: {...}
    if (ch === "{") {
      return this.parseTuple();
    }

    // String: "..."
    if (ch === '"') {
      return this.parseString();
    }

    // Charlist: '...'
    if (ch === "'") {
      return this.parseCharlist();
    }

    // Atom value: :atom
    if (ch === ":") {
      const next = this.peekAt(1);
      if (next && (this.isAtomStartChar(next) || next === '"')) {
        return this.parseAtomValue();
      }
    }

    // Number (positive or negative)
    if (
      this.isDigit(ch) ||
      (ch === "-" &&
        this.peekAt(1) !== undefined &&
        this.isDigit(this.peekAt(1)!))
    ) {
      return this.parseNumber();
    }

    // Keywords: true, false, nil; or bareword identifiers
    if (this.isIdentStart(ch)) {
      return this.parseKeyword();
    }

    throw new ElixirParseError(`Unexpected character '${ch}'`, this.pos);
  }

  private parseStruct(): Record<string, unknown> {
    this.expect("%");
    // Skip module name (e.g., MyModule, __MODULE__, Foo.Bar)
    while (
      this.pos < this.input.length &&
      this.input[this.pos] !== "{" &&
      this.input[this.pos] !== " "
    ) {
      this.pos++;
    }
    this.skipWhitespace();
    if (this.peek() !== "{") {
      throw new ElixirParseError("Expected '{' after struct module name", this.pos);
    }
    // Parse as a plain map
    return this.parseMapBody();
  }

  private parseMap(): Record<string, unknown> {
    this.expect("%");
    return this.parseMapBody();
  }

  private parseMapBody(): Record<string, unknown> {
    this.expect("{");
    const result: Record<string, unknown> = {};
    this.skipWhitespace();

    if (this.peek() === "}") {
      this.consume();
      return result;
    }

    while (true) {
      this.skipWhitespace();

      const ch = this.peek();
      if (ch === undefined) {
        throw new ElixirParseError("Unexpected end of map", this.pos);
      }

      let key: string;
      let value: unknown;

      if (ch === '"') {
        // String key: "key" => value
        key = this.parseString();
        this.skipWhitespace();
        this.expectArrow();
        this.skipWhitespace();
        value = this.parseValue();
      } else if (ch === ":") {
        // Explicit atom key: :atom => value  OR  :"quoted" => value
        this.consume(); // consume ':'
        if (this.peek() === '"') {
          key = this.parseString();
        } else if (this.isAtomStartChar(this.peek()!)) {
          key = this.parseAtomName();
        } else {
          throw new ElixirParseError("Invalid atom key", this.pos);
        }
        this.skipWhitespace();
        this.expectArrow();
        this.skipWhitespace();
        value = this.parseValue();
      } else if (this.isIdentStart(ch)) {
        // Could be atom shorthand: key: value
        const ident = this.parseAtomName();
        this.skipWhitespace();

        if (this.peek() === ":" && this.peekAt(1) !== ":") {
          // Atom shorthand: key: value
          this.consume(); // consume ':'
          key = ident;
          this.skipWhitespace();
          value = this.parseValue();
        } else if (this.peek() === "=" && this.peekAt(1) === ">") {
          // Bareword => value (unusual but handle it)
          this.consume();
          this.consume();
          key = ident;
          this.skipWhitespace();
          value = this.parseValue();
        } else {
          throw new ElixirParseError(
            `Expected ':' or '=>' after key '${ident}'`,
            this.pos
          );
        }
      } else {
        throw new ElixirParseError(
          `Unexpected character in map key: '${ch}'`,
          this.pos
        );
      }

      result[key] = value;

      this.skipWhitespace();
      if (this.peek() === ",") {
        this.consume();
        this.skipWhitespace();
        // Allow trailing comma
        if (this.peek() === "}") break;
      } else {
        break;
      }
    }

    this.skipWhitespace();
    this.expect("}");
    return result;
  }

  private expectArrow(): void {
    if (this.peek() === "=" && this.peekAt(1) === ">") {
      this.consume();
      this.consume();
    } else {
      throw new ElixirParseError(
        `Expected '=>' but got '${this.input.slice(this.pos, this.pos + 2)}'`,
        this.pos
      );
    }
  }

  private parseList(): unknown[] {
    this.expect("[");
    const result: unknown[] = [];
    this.skipWhitespace();

    if (this.peek() === "]") {
      this.consume();
      return result;
    }

    while (true) {
      this.skipWhitespace();
      result.push(this.parseValue());
      this.skipWhitespace();
      if (this.peek() === ",") {
        this.consume();
        this.skipWhitespace();
        if (this.peek() === "]") break;
      } else {
        break;
      }
    }

    this.skipWhitespace();
    this.expect("]");
    return result;
  }

  private parseTuple(): unknown[] {
    this.expect("{");
    const result: unknown[] = [];
    this.skipWhitespace();

    if (this.peek() === "}") {
      this.consume();
      return result;
    }

    while (true) {
      this.skipWhitespace();
      result.push(this.parseValue());
      this.skipWhitespace();
      if (this.peek() === ",") {
        this.consume();
        this.skipWhitespace();
        if (this.peek() === "}") break;
      } else {
        break;
      }
    }

    this.skipWhitespace();
    this.expect("}");
    return result;
  }

  private parseString(): string {
    this.expect('"');
    let result = "";

    while (true) {
      const ch = this.peek();
      if (ch === undefined) {
        throw new ElixirParseError("Unterminated string", this.pos);
      }

      if (ch === '"') {
        this.consume();
        break;
      }

      if (ch === "\\") {
        this.consume();
        const esc = this.consume();
        switch (esc) {
          case '"':
            result += '"';
            break;
          case "\\":
            result += "\\";
            break;
          case "n":
            result += "\n";
            break;
          case "t":
            result += "\t";
            break;
          case "r":
            result += "\r";
            break;
          case "0":
            result += "\0";
            break;
          case "a":
            result += "\x07";
            break;
          case "b":
            result += "\b";
            break;
          case "f":
            result += "\f";
            break;
          case "v":
            result += "\v";
            break;
          case "e":
            result += "\x1b";
            break;
          case "u": {
            if (this.peek() === "{") {
              this.consume();
              let hex = "";
              while (this.peek() !== "}") hex += this.consume();
              this.consume();
              result += String.fromCodePoint(parseInt(hex, 16));
            } else {
              let hex = "";
              for (let i = 0; i < 4; i++) hex += this.consume();
              result += String.fromCharCode(parseInt(hex, 16));
            }
            break;
          }
          case "x": {
            let hex = "";
            for (let i = 0; i < 2; i++) hex += this.consume();
            result += String.fromCharCode(parseInt(hex, 16));
            break;
          }
          default:
            result += esc;
        }
      } else {
        result += ch;
        this.consume();
      }
    }

    return result;
  }

  private parseCharlist(): string {
    // Single-quoted strings (charlists) - treat as plain strings
    this.expect("'");
    let result = "";

    while (true) {
      const ch = this.peek();
      if (ch === undefined) {
        throw new ElixirParseError("Unterminated charlist", this.pos);
      }
      if (ch === "'") {
        this.consume();
        break;
      }
      if (ch === "\\") {
        this.consume();
        const esc = this.consume();
        switch (esc) {
          case "'":
            result += "'";
            break;
          case "\\":
            result += "\\";
            break;
          case "n":
            result += "\n";
            break;
          case "t":
            result += "\t";
            break;
          default:
            result += esc;
        }
      } else {
        result += ch;
        this.consume();
      }
    }

    return result;
  }

  private parseAtomValue(): string | null | boolean {
    this.consume(); // consume ':'

    if (this.peek() === '"') {
      return this.parseString();
    }

    const name = this.parseAtomName();
    if (name === "nil") return null;
    if (name === "true") return true;
    if (name === "false") return false;
    return name; // atom as string
  }

  private parseAtomName(): string {
    let name = "";
    while (this.pos < this.input.length) {
      const ch = this.input[this.pos];
      if (this.isAtomChar(ch)) {
        name += ch;
        this.pos++;
      } else {
        break;
      }
    }
    if (!name) throw new ElixirParseError("Expected atom name", this.pos);
    return name;
  }

  private parseKeyword(): unknown {
    const ident = this.parseAtomName();
    switch (ident) {
      case "true":
        return true;
      case "false":
        return false;
      case "nil":
        return null;
      default:
        return ident; // bareword identifier → string
    }
  }

  private parseNumber(): number {
    let numStr = "";

    if (this.peek() === "-") {
      numStr += this.consume();
    }

    // Special formats: 0x, 0o, 0b
    if (this.peek() === "0") {
      const next = this.peekAt(1);
      if (next === "x" || next === "X") {
        this.consume();
        this.consume();
        let hex = "";
        while (
          this.pos < this.input.length &&
          /[0-9a-fA-F_]/.test(this.input[this.pos])
        ) {
          const c = this.consume();
          if (c !== "_") hex += c;
        }
        return parseInt((numStr === "-" ? "-" : "") + hex, 16);
      }
      if (next === "o" || next === "O") {
        this.consume();
        this.consume();
        let oct = "";
        while (
          this.pos < this.input.length &&
          /[0-7_]/.test(this.input[this.pos])
        ) {
          const c = this.consume();
          if (c !== "_") oct += c;
        }
        return parseInt((numStr === "-" ? "-" : "") + oct, 8);
      }
      if (next === "b" || next === "B") {
        this.consume();
        this.consume();
        let bin = "";
        while (
          this.pos < this.input.length &&
          /[01_]/.test(this.input[this.pos])
        ) {
          const c = this.consume();
          if (c !== "_") bin += c;
        }
        return parseInt((numStr === "-" ? "-" : "") + bin, 2);
      }
    }

    // Regular integer or float (with _ separator support)
    while (
      this.pos < this.input.length &&
      (this.isDigit(this.input[this.pos]) || this.input[this.pos] === "_")
    ) {
      const c = this.consume();
      if (c !== "_") numStr += c;
    }

    // Float
    if (
      this.peek() === "." &&
      this.peekAt(1) !== undefined &&
      this.isDigit(this.peekAt(1)!)
    ) {
      numStr += this.consume(); // .
      while (
        this.pos < this.input.length &&
        (this.isDigit(this.input[this.pos]) || this.input[this.pos] === "_")
      ) {
        const c = this.consume();
        if (c !== "_") numStr += c;
      }
      // Exponent
      if (this.peek() === "e" || this.peek() === "E") {
        numStr += this.consume();
        if (this.peek() === "+" || this.peek() === "-") {
          numStr += this.consume();
        }
        while (
          this.pos < this.input.length &&
          this.isDigit(this.input[this.pos])
        ) {
          numStr += this.consume();
        }
      }
      return parseFloat(numStr);
    }

    return parseInt(numStr, 10);
  }

  private isDigit(ch: string): boolean {
    return ch >= "0" && ch <= "9";
  }

  private isIdentStart(ch: string): boolean {
    return (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z") || ch === "_";
  }

  private isAtomStartChar(ch: string): boolean {
    return (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z") || ch === "_";
  }

  private isAtomChar(ch: string): boolean {
    return (
      this.isAtomStartChar(ch) ||
      (ch >= "0" && ch <= "9") ||
      ch === "!" ||
      ch === "?" ||
      ch === "@" ||
      ch === "."
    );
  }

  parseComplete(): unknown {
    const value = this.parseValue();
    this.skipWhitespace();
    if (this.pos < this.input.length) {
      throw new ElixirParseError(
        `Unexpected content after value: '${this.input.slice(this.pos, this.pos + 20)}'`,
        this.pos
      );
    }
    return value;
  }
}

export type ParseResult =
  | { success: true; value: unknown }
  | { success: false; error: string };

export function parseElixirValue(input: string): ParseResult {
  try {
    const trimmed = input.trim();
    if (!trimmed) {
      return { success: false, error: "Input is empty" };
    }
    const parser = new ElixirParser(trimmed);
    const value = parser.parseComplete();
    return { success: true, value };
  } catch (e) {
    if (e instanceof ElixirParseError) {
      return { success: false, error: e.message };
    }
    return { success: false, error: String(e) };
  }
}
