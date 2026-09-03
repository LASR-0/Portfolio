import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

/* Everything is revalidated here. The client checks in EnquiryForm exist to
   give fast feedback, not to be trusted — the prototype had client-only
   validation and no server at all. plan.md §7 */

export const prerender = false;

const TYPES = ["Internal tool", "Desktop app", "Automation", "Something else"];
const MAX = { name: 120, email: 200, brief: 5000 };

const bad = (error: string) => Response.json({ ok: false, error }, { status: 400 });

async function verifyTurnstile(secret: string, token: string, ip: string | null) {
  const body = new FormData();
  body.append("secret", secret);
  body.append("response", token);
  if (ip) body.append("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
  });
  const json: any = await res.json();
  return json?.success === true;
}

export const POST: APIRoute = async ({ request }) => {
  const secrets = env as any;
  let data: any;
  try {
    data = await request.json();
  } catch {
    return bad("Malformed request.");
  }

  // Honeypot — a real person never fills this.
  if (typeof data.company === "string" && data.company.trim() !== "") {
    // Report success so a bot has nothing to learn from the response.
    return Response.json({ ok: true }, { status: 200 });
  }

  const name = String(data.name ?? "").trim();
  const email = String(data.email ?? "").trim();
  const brief = String(data.brief ?? "").trim();
  const type = String(data.type ?? "");
  const scope = String(data.scope ?? "").slice(0, 60);

  if (!name || name.length > MAX.name) return bad("No name. I need something to call you.");
  if (!/.+@.+\..+/.test(email) || email.length > MAX.email) return bad("That email will not reach you. Fix it.");
  if (brief.length < 20 || brief.length > MAX.brief) return bad("The brief is too thin. A few sentences, minimum.");
  if (type && !TYPES.includes(type)) return bad("Unrecognised project type.");

  /* Turnstile is enforced only once a secret is configured, so local dev works
     without one. TODO: the widget still has to be rendered in EnquiryForm and
     its token posted as `turnstileToken` before this does anything. */
  if (secrets.TURNSTILE_SECRET) {
    const ok = await verifyTurnstile(
      secrets.TURNSTILE_SECRET,
      String(data.turnstileToken ?? ""),
      request.headers.get("cf-connecting-ip"),
    );
    if (!ok) return bad("Could not verify that request came from a browser.");
  }

  if (!secrets.RESEND_API_KEY || !secrets.ENQUIRY_TO) {
    // Fail loudly rather than silently dropping a paying client's message.
    return Response.json({ ok: false, error: "Mail is not configured." }, { status: 503 });
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${secrets.RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: secrets.ENQUIRY_FROM ?? "portfolio@example.invalid",
      to: [secrets.ENQUIRY_TO],
      reply_to: email,
      subject: `Enquiry — ${name} — ${type || "unspecified"}`,
      text: [
        `Name:  ${name}`,
        `Email: ${email}`,
        `Type:  ${type || "unspecified"}`,
        `Scope: ${scope || "unspecified"}`,
        "",
        brief,
      ].join("\n"),
    }),
  });

  if (!res.ok) {
    return Response.json({ ok: false, error: "Send failed." }, { status: 502 });
  }

  return Response.json({ ok: true }, { status: 200 });
};
