import type { CSSProperties } from "react";

export const emailTemplateStyles: Record<string, CSSProperties> = {
  body: {
    margin: 0,
    padding: 0,
    backgroundColor: "#f8f7fc",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  container: {
    width: "100%",
    maxWidth: "600px",
    margin: "0 auto",
    backgroundColor: "#f8f7fc",
  },
  wrapper: {
    padding: "40px 20px",
  },
  header: {
    width: "100%",
    marginBottom: "32px",
  },
  logoCell: {
    textAlign: "center",
    padding: "0 0 24px 0",
  },
  logo: {
    borderRadius: "12px",
    verticalAlign: "middle",
  },
  logoText: {
    display: "inline-block",
    marginLeft: "12px",
    fontSize: "24px",
    fontWeight: 700,
    color: "#1a1625",
    verticalAlign: "middle",
  },
  content: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 4px 24px rgba(107, 70, 193, 0.08)",
  },
  contentCell: {
    padding: "48px 40px",
  },
  heading: {
    margin: "0 0 16px 0",
    fontSize: "28px",
    fontWeight: 700,
    color: "#1a1625",
    lineHeight: 1.3,
  },
  paragraph: {
    margin: "0 0 24px 0",
    fontSize: "16px",
    lineHeight: 1.6,
    color: "#4a4458",
  },
  finePrint: {
    margin: "0 0 32px 0",
    fontSize: "14px",
    lineHeight: 1.6,
    color: "#7c7589",
  },
  buttonContainer: {
    margin: "0 0 24px 0",
  },
  buttonCell: {
    textAlign: "center",
  },
  button: {
    display: "inline-block",
    padding: "14px 32px",
    backgroundColor: "#7c3aed",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: 600,
    textDecoration: "none",
    borderRadius: "8px",
  },
  altLink: {
    margin: "24px 0 0 0",
    fontSize: "13px",
    color: "#7c7589",
    lineHeight: 1.6,
    wordBreak: "break-all",
  },
  link: {
    color: "#7c3aed",
    textDecoration: "underline",
  },
  footer: {
    width: "100%",
    marginTop: "32px",
  },
  footerCell: {
    textAlign: "center",
    padding: "24px",
  },
  footerText: {
    margin: "0 0 8px 0",
    fontSize: "13px",
    color: "#7c7589",
    lineHeight: 1.5,
  },
  footerLink: {
    color: "#7c3aed",
    textDecoration: "underline",
  },
  footerMuted: {
    margin: "16px 0 0 0",
    fontSize: "12px",
    color: "#a3a0ad",
  },
};
