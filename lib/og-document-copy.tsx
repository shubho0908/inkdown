import type { ReactElement } from "react";

const TITLE_BASE_STYLE = {
  margin: 0,
  maxWidth: "100%",
  lineHeight: 0.95,
  letterSpacing: "-0.06em",
  fontWeight: 600,
  color: "#f8fafc",
  fontFamily: "Geist",
  whiteSpace: "pre-wrap" as const,
  textAlign: "left" as const,
};

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
    titleLength <= 18 ? "120px" : titleLength <= 30 ? "108px" : titleLength <= 42 ? "94px" : "78px";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        width: "100%",
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      <h1 style={{ ...TITLE_BASE_STYLE, fontSize }}>{title}</h1>

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
