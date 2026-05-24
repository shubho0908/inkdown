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
    titleLength <= 18 ? "92px" : titleLength <= 30 ? "80px" : titleLength <= 42 ? "70px" : "58px";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        width: "100%",
        minWidth: 0,
      }}
    >
      <h1
        style={{
          margin: 0,
          maxWidth: "940px",
          fontSize,
          lineHeight: 0.95,
          letterSpacing: "-0.06em",
          fontWeight: 700,
          color: "#f8fafc",
          fontFamily: "Geist",
          whiteSpace: "pre-wrap",
          textAlign: "left",
        }}
      >
        {title}
      </h1>

      {username && (
        <p
          style={{
            margin: 0,
            marginTop: "14px",
            fontSize: "26px",
            lineHeight: 1.2,
            fontWeight: 500,
            color: "rgba(226,232,240,0.6)",
            fontFamily: "Geist",
          }}
        >
          by {username}
        </p>
      )}
    </div>
  );
}
