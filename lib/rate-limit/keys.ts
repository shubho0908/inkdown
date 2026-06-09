const PREFIX = "inkdown";

function normalizeEmail(email: string) {
  return email.toLowerCase().trim();
}

export function authEmailRecipientKey(email: string) {
  return `${PREFIX}:auth-email:recipient:${normalizeEmail(email)}`;
}

export function verificationGateResendIpKey(ip: string) {
  return `${PREFIX}:verification-gate:ip:${ip}`;
}

export function checkEmailIpKey(ip: string) {
  return `${PREFIX}:check-email:ip:${ip}`;
}
