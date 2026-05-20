import type { ReactElement } from "react";

interface DocumentCopyProps {
  title: string;
  preview: string;
  username?: string | null;
}

export function DocumentCopy({
  title,
  preview: _preview,
  username,
}: DocumentCopyProps): ReactElement {
  const titleLength = title.replace(/\s+/g, " ").trim().length;
  const fontSize =
    titleLength <= 18 ? "102px" : titleLength <= 30 ? "90px" : titleLength <= 42 ? "78px" : "66px";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        minWidth: 0,
        padding: "0 24px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "100%",
            maxWidth: "940px",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <h1
            style={{
              margin: 0,
              maxWidth: "100%",
              fontSize,
              lineHeight: 0.92,
              letterSpacing: "-0.08em",
              fontWeight: 600,
              color: "#f8fafc",
              fontFamily: '"Playfair Display"',
              whiteSpace: "pre-wrap",
              textAlign: "center",
            }}
          >
            {title}
          </h1>
        </div>

        {username && (
          <p
            style={{
              margin: 0,
              fontSize: "28px",
              lineHeight: 1.2,
              fontWeight: 500,
              color: "rgba(226,232,240,0.72)",
              fontFamily: "Geist",
            }}
          >
            {username}
          </p>
        )}
      </div>
    </div>
  );
}
