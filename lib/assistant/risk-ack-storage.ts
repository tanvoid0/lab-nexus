/** Per-user browser flag: user accepted experimental-assistant notice. Bump version if notice text materially changes. */
const PREFIX = "lab-nexus:assistant:risk-ack:v1:";

export function riskAckStorageKey(userId: string) {
  return `${PREFIX}${userId}`;
}

export function readRiskAcknowledged(userId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(riskAckStorageKey(userId)) === "1";
  } catch {
    return false;
  }
}

export function writeRiskAcknowledged(userId: string): void {
  try {
    window.localStorage.setItem(riskAckStorageKey(userId), "1");
  } catch {
    /* quota / private mode */
  }
}

export function clearRiskAcknowledged(userId: string): void {
  try {
    window.localStorage.removeItem(riskAckStorageKey(userId));
  } catch {
    /* ignore */
  }
}
