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
    titleLength <= 14 ? "116px" : titleLength <= 24 ? "104px" : titleLength <= 36 ? "90px" : "74px";

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
    </div>
  );
}
