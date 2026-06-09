const IP_HEADERS = ["cf-connecting-ip", "x-forwarded-for", "x-real-ip"] as const;

function firstForwardedIp(value: string) {
  return value.split(",")[0]?.trim() ?? "";
}

export function getClientIp(headers: Headers): string {
  for (const header of IP_HEADERS) {
    const value = headers.get(header);
    if (!value) {
      continue;
    }

    const ip = header === "x-forwarded-for" ? firstForwardedIp(value) : value.trim();
    if (ip) {
      return ip;
    }
  }

  return "unknown";
}
