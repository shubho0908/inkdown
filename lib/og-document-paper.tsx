import type { ReactElement } from "react";

interface DocumentPaperProps {
  preview: string;
  hostLabel: string;
  logoUrl: string;
}

export function DocumentPaper({ preview, hostLabel, logoUrl }: DocumentPaperProps): ReactElement {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "450px",
        flexShrink: 0,
        borderRadius: "30px",
        background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,250,252,0.9))",
        padding: "20px",
        boxShadow: "0 32px 90px rgba(2,6,23,0.45), inset 0 1px 0 rgba(255,255,255,0.75)",
        border: "1px solid rgba(255,255,255,0.42)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          height: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "#0f172a",
            }}
          >
            Readable markdown
          </span>
          <div
            style={{
              borderRadius: "999px",
              background: "rgba(59,130,246,0.1)",
              border: "1px solid rgba(59,130,246,0.18)",
              padding: "6px 10px",
              fontSize: "12px",
              fontWeight: 700,
              color: "#2563eb",
            }}
          >
            Shared link
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            flex: 1,
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div
              style={{
                height: "12px",
                width: "12px",
                borderRadius: "999px",
                background: "#2563eb",
              }}
            />
            <div
              style={{
                height: "14px",
                width: "34%",
                borderRadius: "999px",
                background: "rgba(15,23,42,0.12)",
              }}
            />
          </div>

          <div
            style={{
              height: "1px",
              width: "100%",
              background: "rgba(15,23,42,0.08)",
            }}
          />

          {getPreviewRows(preview).map((row, index) => (
            <div
              key={`preview-row-${index}-${row}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                width: "100%",
              }}
            >
              <div
                style={{
                  height: "7px",
                  width: "7px",
                  borderRadius: "999px",
                  background: index === 1 ? "rgba(37,99,235,0.7)" : "rgba(100,116,139,0.46)",
                }}
              />
              <div
                style={{
                  height: index === 1 ? "18px" : "15px",
                  width: row,
                  borderRadius: index === 1 ? "8px" : "999px",
                  background: index === 1 ? "rgba(37,99,235,0.14)" : "rgba(15,23,42,0.1)",
                }}
              />
            </div>
          ))}
        </div>

        <div
          style={{
            height: "1px",
            width: "100%",
            background: "rgba(15,23,42,0.08)",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <img
              src={logoUrl}
              width={30}
              height={30}
              alt=""
              style={{ display: "block", borderRadius: "10px" }}
            />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "2px",
              }}
            >
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                Inkdown
              </span>
              <span
                style={{
                  fontSize: "12px",
                  color: "rgba(15,23,42,0.58)",
                }}
              >
                {hostLabel}
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div
              style={{
                height: "8px",
                width: "8px",
                borderRadius: "999px",
                background: "#22c55e",
              }}
            />
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "rgba(15,23,42,0.62)",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              Public
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function getPreviewRows(preview: string) {
  const length = preview.trim().length;

  if (length > 180) {
    return ["86%", "67%", "90%", "76%", "58%"];
  }

  if (length > 90) {
    return ["82%", "61%", "86%", "68%"];
  }

  return ["78%", "54%", "69%", "46%"];
}
