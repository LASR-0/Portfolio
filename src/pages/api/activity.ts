import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

/* GitHub contribution graph. Token lives in a Worker secret and never reaches
   the bundle. Edge-cached so the GraphQL API is hit at most a few times a day.

   Deliberately not a build-time fetch: this decouples data freshness from
   deploys and makes the designed NO SIGNAL state genuinely reachable rather
   than decorative. plan.md §7

   NOTE: private-repo commits only appear if "Include private contributions on
   my profile" is enabled on the GitHub account AND the token can see them. */

export const prerender = false;

const LOGIN = "LASR-0";
const TTL = 60 * 60 * 6; // 6 hours

const QUERY = `
  query($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks { contributionDays { contributionCount date } }
        }
      }
    }
  }
`;

function toLevel(count: number): number {
  if (count === 0) return 0;
  if (count < 3) return 1;
  if (count < 6) return 2;
  if (count < 10) return 3;
  return 4;
}

export const GET: APIRoute = async ({ request }) => {
  const token = (env as any).GITHUB_TOKEN;

  const cache = (globalThis as any).caches?.default;
  const cacheKey = new Request(new URL(request.url).origin + "/api/activity");

  if (cache) {
    const hit = await cache.match(cacheKey);
    if (hit) return hit;
  }

  if (!token) {
    // No token configured — the client renders NO SIGNAL. This is a real
    // state, not an error page.
    return Response.json({ signal: false, reason: "no-token" }, { status: 200 });
  }

  try {
    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        authorization: `bearer ${token}`,
        "content-type": "application/json",
        "user-agent": "lukeroxburgh-portfolio",
      },
      body: JSON.stringify({ query: QUERY, variables: { login: LOGIN } }),
    });

    if (!res.ok) throw new Error(`github ${res.status}`);
    const json: any = await res.json();
    const cal = json?.data?.user?.contributionsCollection?.contributionCalendar;
    if (!cal) throw new Error("unexpected shape");

    const days = cal.weeks.flatMap((w: any) => w.contributionDays);
    const payload = {
      signal: true,
      total: cal.totalContributions as number,
      levels: days.map((d: any) => toLevel(d.contributionCount)) as number[],
    };

    const out = Response.json(payload, {
      headers: { "cache-control": `public, max-age=${TTL}` },
    });
    if (cache) await cache.put(cacheKey, out.clone());
    return out;
  } catch {
    return Response.json({ signal: false, reason: "fetch-failed" }, { status: 200 });
  }
};
