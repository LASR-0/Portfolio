/* DEV FIXTURE ONLY — seeded, not real contribution data.
   Replaced by GET /api/activity (GitHub GraphQL, token as a Worker secret,
   edge-cached) in a later commit. plan.md §7. The "SEEDED DATA" label in the
   rendered footer row exists so this cannot ship unnoticed.

   Ported from the prototype's constructor LCG so the layout is stable
   between builds. */

export const WEEKS = 52;
export const DAYS = 7;

export function seededLevels(): number[] {
  let seed = 7;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  return Array.from({ length: WEEKS * DAYS }, (_, i) => {
    const dow = i % DAYS;
    const weekend = dow === 0 || dow === 6;
    const r = rnd();
    let lvl = r > 0.62 ? 1 : 0;
    if (r > 0.78) lvl = 2;
    if (r > 0.9) lvl = 3;
    if (r > 0.965) lvl = 4;
    if (weekend && lvl > 0) lvl = Math.max(0, lvl - 1);
    return lvl;
  });
}

export const MONTHS = ["SEP","OCT","NOV","DEC","JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG"];
