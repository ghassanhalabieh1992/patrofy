import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #4c1d95, #7c3aed)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 8,
          fontFamily: "sans-serif",
          fontWeight: 800,
          fontSize: 20,
          color: "white",
        }}
      >
        P
      </div>
    ),
    { ...size }
  );
}
