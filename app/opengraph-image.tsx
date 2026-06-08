import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Patrofy — Moldes com IA";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #4c1d95 50%, #0f172a 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        {/* Icon */}
        <div style={{
          width: 120, height: 120,
          background: "rgba(139,92,246,0.3)",
          border: "3px solid rgba(139,92,246,0.6)",
          borderRadius: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 40,
          fontSize: 64,
        }}>
          📐
        </div>

        {/* Title */}
        <div style={{
          fontSize: 96,
          fontWeight: 800,
          color: "white",
          letterSpacing: "-2px",
          marginBottom: 20,
        }}>
          Patrofy
        </div>

        {/* Subtitle */}
        <div style={{
          fontSize: 36,
          color: "rgba(196,181,253,0.9)",
          fontWeight: 400,
        }}>
          Moldes Profissionais com IA
        </div>

        {/* Domain */}
        <div style={{
          marginTop: 50,
          fontSize: 28,
          color: "rgba(139,92,246,0.8)",
          background: "rgba(139,92,246,0.15)",
          padding: "10px 30px",
          borderRadius: 50,
          border: "1px solid rgba(139,92,246,0.3)",
        }}>
          patrofy.ai
        </div>
      </div>
    ),
    { ...size }
  );
}
