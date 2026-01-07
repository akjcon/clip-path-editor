import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "CSS Clip Path Generator - Create Bezier Curves Online";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              background: "linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)",
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 24,
            }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#e5e5e5"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12.034 12.681a.498.498 0 0 1 .647-.647l9 3.5a.5.5 0 0 1-.033.943l-3.444 1.068a1 1 0 0 0-.66.66l-1.067 3.443a.5.5 0 0 1-.943.033z" />
              <path d="M5 17A12 12 0 0 1 17 5" />
              <circle cx="19" cy="5" r="2" />
              <circle cx="5" cy="19" r="2" />
            </svg>
          </div>
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              color: "white",
            }}
          >
            clippath.app
          </div>
        </div>
        <div
          style={{
            fontSize: 36,
            color: "#a1a1aa",
            textAlign: "center",
            maxWidth: 800,
          }}
        >
          CSS Clip Path Generator
        </div>
        <div
          style={{
            fontSize: 24,
            color: "#71717a",
            marginTop: 16,
          }}
        >
          Create bezier curves & polygons visually
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
