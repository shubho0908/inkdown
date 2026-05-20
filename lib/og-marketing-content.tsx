import type { ReactElement } from "react";

interface MarketingContentProps {
  title: string;
  hostLabel: string;
  logoUrl: string;
}

export function MarketingContent({
  title,
  hostLabel: _hostLabel,
  logoUrl: _logoUrl,
}: MarketingContentProps): ReactElement {
  const titleLength = title.replace(/\s+/g, " ").trim().length;
  const fontSize =
    titleLength <= 14 ? "96px" : titleLength <= 24 ? "84px" : titleLength <= 36 ? "72px" : "62px";

  return (
    <div
      style={{
        display: "flex",
        flex: 1,
        width: "100%",
        minHeight: 0,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          padding: "0 24px",
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
              lineHeight: 0.94,
              letterSpacing: "-0.06em",
              fontWeight: 600,
              color: "#f8fafc",
              fontFamily: "Geist",
              whiteSpace: "pre-wrap",
              textAlign: "center",
            }}
          >
            {title}
          </h1>
        </div>
      </div>
    </div>
  );
}
