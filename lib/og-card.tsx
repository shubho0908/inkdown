import type { ReactElement } from "react";
import { DocumentContent } from "@/lib/og-document-content";
import { MarketingContent } from "@/lib/og-marketing-content";
import { clampText, getHostLabel, getOgBaseUrl } from "@/lib/og-shared";

interface OgCardProps {
  title: string;
  preview?: string;
  username?: string | null;
  isDoc?: boolean;
  baseUrl?: string;
  logoUrl: string;
}

export function OgCard({
  title,
  preview = "",
  username,
  isDoc = false,
  baseUrl,
  logoUrl,
}: OgCardProps): ReactElement {
  const safeBaseUrl = getOgBaseUrl(baseUrl);
  const hostLabel = getHostLabel(safeBaseUrl);
  const displayTitle = clampText(title || "Untitled", 65);
  const displayPreview = clampText(preview, isDoc ? 150 : 160);
  const ctaText = isDoc ? `Open on ${hostLabel}` : `Get started on ${hostLabel}`;

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background: "#18181b",
        color: "#f8fafc",
        fontFamily: "Geist",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage: "linear-gradient(180deg, rgba(255,255,255,0.42), transparent 78%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: "44px",
          borderRadius: "28px",
          border: "1px solid rgba(255,255,255,0.1)",
          background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
          boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
        }}
      />

      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          boxSizing: "border-box",
          padding: "52px 60px 36px",
        }}
      >
        <div
          style={{
            display: "flex",
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
            alignItems: "flex-start",
            justifyContent: "flex-start",
            width: "100%",
            padding: "0 8px",
          }}
        >
          {isDoc ? (
            <DocumentContent
              title={displayTitle}
              preview={displayPreview}
              username={username}
              hostLabel={hostLabel}
              logoUrl={logoUrl}
            />
          ) : (
            <MarketingContent title={displayTitle} hostLabel={hostLabel} logoUrl={logoUrl} />
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            padding: "0 8px",
            marginTop: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <img
              src={logoUrl}
              width={48}
              height={48}
              alt=""
              style={{
                display: "block",
                borderRadius: "12px",
                boxShadow: "0 10px 24px rgba(0,0,0,0.25)",
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
              <span
                style={{
                  fontSize: "26px",
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                  lineHeight: 1.1,
                  color: "#f8fafc",
                }}
              >
                Inkdown
              </span>
              <span
                style={{
                  fontSize: "26px",
                  fontWeight: 500,
                  color: "rgba(226,232,240,0.45)",
                }}
              >
                Markdown workspace
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexShrink: 0,
              borderRadius: "999px",
              border: "1px solid rgba(255,255,255,0.10)",
              padding: "11px 24px",
              background: "rgba(255,255,255,0.05)",
              fontSize: "26px",
              fontWeight: 500,
              color: "rgba(241,245,249,0.7)",
              letterSpacing: "0.01em",
              whiteSpace: "nowrap",
            }}
          >
            {ctaText}
          </div>
        </div>
      </div>
    </div>
  );
}
