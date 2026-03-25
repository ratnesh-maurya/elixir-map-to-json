import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Elixir ↔ JSON — Free Map & Struct Converter";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0d1117",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Purple gradient top bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: "linear-gradient(90deg, #7c3aed, #a78bfa, #7c3aed)",
          }}
        />

        {/* Background glow */}
        <div
          style={{
            position: "absolute",
            top: -200,
            left: -200,
            width: 600,
            height: 600,
            background: "radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -200,
            right: -100,
            width: 500,
            height: 500,
            background: "radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: "64px 80px",
            justifyContent: "space-between",
          }}
        >
          {/* Top: icon + site name */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 56,
                height: 56,
                background: "#7c3aed",
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
              }}
            >
              ⚗
            </div>
            <span
              style={{
                fontSize: 18,
                color: "#8b949e",
                letterSpacing: "-0.01em",
              }}
            >
              elixir.ratnesh-maurya.com
            </span>
          </div>

          {/* Middle: title + subtitle */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                fontSize: 72,
                fontWeight: 800,
                color: "#e6edf3",
                letterSpacing: "-0.04em",
                lineHeight: 1.05,
              }}
            >
              Elixir ↔ JSON
            </div>
            <div
              style={{
                fontSize: 26,
                color: "#8b949e",
                letterSpacing: "-0.01em",
              }}
            >
              Free Map &amp; Struct Converter — Runs in your browser
            </div>

            {/* Three tool pills */}
            <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
              {[
                "Elixir Map → JSON",
                "JSON → Elixir Map",
                "JSON → defstruct",
              ].map((label) => (
                <div
                  key={label}
                  style={{
                    background: "#1e1b4b",
                    border: "1px solid rgba(167,139,250,0.3)",
                    borderRadius: 8,
                    padding: "8px 18px",
                    fontSize: 15,
                    color: "#a78bfa",
                    fontFamily: "ui-monospace, monospace",
                    fontWeight: 500,
                  }}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom: by + features */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#3fb950",
                }}
              />
              <span style={{ fontSize: 14, color: "#484f58" }}>
                No signup · No server · 100% private
              </span>
            </div>
            <span style={{ fontSize: 16, color: "#484f58" }}>
              by Ratnesh Maurya
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
