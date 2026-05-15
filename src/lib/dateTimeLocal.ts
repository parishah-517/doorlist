/** `YYYY-MM-DDTHH:mm` in local time, compatible with `Date` parsing. */
export function toLocalInputValue(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function parseLocalInput(s: string): Date {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

/** Current local time snapped to the next 15-minute increment. */
export function defaultStartToday(): string {
  const d = new Date();
  const remainder = d.getMinutes() % 15;
  const bump = remainder === 0 ? 0 : 15 - remainder;
  d.setMinutes(d.getMinutes() + bump, 0, 0);
  return toLocalInputValue(d);
}

export function addHours(isoLocal: string, n: number): string {
  const d = parseLocalInput(isoLocal);
  d.setHours(d.getHours() + n);
  return toLocalInputValue(d);
}

export function addOneHour(isoLocal: string): string {
  return addHours(isoLocal, 1);
}
