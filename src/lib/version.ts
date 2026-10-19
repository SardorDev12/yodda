/**
 * Compares dot-separated version strings ("1.2.0" vs "1.10.0") numerically
 * per segment — a plain string comparison would sort "1.10.0" before
 * "1.2.0". Missing/non-numeric segments count as 0.
 */
export function compareVersions(a: string, b: string): number {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);
  const length = Math.max(partsA.length, partsB.length);
  for (let i = 0; i < length; i++) {
    const na = partsA[i] || 0;
    const nb = partsB[i] || 0;
    if (na !== nb) return na - nb;
  }
  return 0;
}

export function isVersionBelow(current: string, target: string): boolean {
  return compareVersions(current, target) < 0;
}
