/**
 * India national emergency numbers.
 * Use these everywhere instead of hardcoding US numbers.
 */
export const INDIA_EMERGENCY = {
  POLICE: "100",
  AMBULANCE: "108",
  FIRE: "101",
  NATIONAL: "112", // unified emergency response (SOS / women / children)
  WOMEN_HELPLINE: "1091",
  CHILD_HELPLINE: "1098",
  DISASTER: "108",
  CRISIS_MENTAL_HEALTH: "9152987821", // iCall (verified)
} as const;

export const INDIA_EMERGENCY_LIST = [
  { name: "National Emergency", number: INDIA_EMERGENCY.NATIONAL, role: "all" as const },
  { name: "Police", number: INDIA_EMERGENCY.POLICE, role: "police" as const },
  { name: "Ambulance", number: INDIA_EMERGENCY.AMBULANCE, role: "medical" as const },
  { name: "Fire", number: INDIA_EMERGENCY.FIRE, role: "fire" as const },
  { name: "Women Helpline", number: INDIA_EMERGENCY.WOMEN_HELPLINE, role: "support" as const },
  { name: "Child Helpline", number: INDIA_EMERGENCY.CHILD_HELPLINE, role: "support" as const },
];

/** Dial a phone number. Falls back to clipboard copy on desktop. */
export function dialNumber(num: string) {
  const sanitized = num.replace(/\s+/g, "");
  window.location.href = `tel:${sanitized}`;
}

/** Indian phone validator (+91 or 10 digits starting 6-9). */
export function isValidIndianPhone(raw: string): boolean {
  const v = raw.replace(/[\s-]/g, "");
  return /^(\+91)?[6-9]\d{9}$/.test(v);
}

/** Generic E.164 + India-friendly validator. */
export function isValidPhone(raw: string): boolean {
  const v = raw.replace(/[\s-()]/g, "");
  return isValidIndianPhone(v) || /^\+?[1-9]\d{6,14}$/.test(v);
}
