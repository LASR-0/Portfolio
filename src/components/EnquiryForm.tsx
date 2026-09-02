import { useId, useRef, useState } from "react";

/* Posts to /api/enquiry, which revalidates everything server-side — the
   prototype's checks were client-only and are not trusted. plan.md §7.

   Accessibility this fixes from the prototype (plan.md §11.5):
     - errors are associated with their field via aria-describedby + aria-invalid
     - a single role="alert" region announces the first failure
     - the scope slider carries aria-valuetext, so it announces "2-4 weeks"
       rather than "2"
     - focus moves to the first invalid control on a failed submit */

const TYPES = ["Internal tool", "Desktop app", "Automation", "Something else"];
const SCOPE_LABELS = ["A FEW DAYS", "1–2 WK", "2–4 WK", "1–3 MO", "LONGER"];
const SCOPE_VALUES = ["A few days", "1–2 weeks", "2–4 weeks", "1–3 months", "Longer than that"];

type Errors = { name?: string; email?: string; brief?: string };

export default function EnquiryForm() {
  const uid = useId();
  const [scope, setScope] = useState(2);
  const [errors, setErrors] = useState<Errors>({});
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  const formRef = useRef<HTMLFormElement>(null);

  const errId = (k: keyof Errors) => `${uid}-${k}-err`;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const brief = String(fd.get("brief") ?? "").trim();

    const next: Errors = {};
    if (!name) next.name = "No name. I need something to call you.";
    if (!/.+@.+\..+/.test(email)) next.email = "That email will not reach you. Fix it.";
    if (brief.length < 20) next.brief = "The brief is too thin. A few sentences, minimum.";

    setErrors(next);
    const first = Object.keys(next)[0];
    if (first) {
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }

    setState("sending");
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name, email, brief,
          type: String(fd.get("type") ?? TYPES[0]),
          scope: SCOPE_VALUES[scope],
          // Honeypot: a real person never fills this.
          company: String(fd.get("company") ?? ""),
        }),
      });
      setState(res.ok ? "sent" : "failed");
    } catch {
      setState("failed");
    }
  }

  if (state === "sent") {
    return (
      <div className="form__sent">
        <h3>Received.</h3>
        <p>
          I read these in the evening, Brisbane time. If it fits, you get a reply
          with a scope and a number in it.
        </p>
      </div>
    );
  }

  const firstError = errors.name ?? errors.email ?? errors.brief;

  return (
    <form ref={formRef} className="form" onSubmit={onSubmit} noValidate>
      <div className="form__box raised">
        <div className="form__row">
          <label className={`field${errors.name ? " field--invalid" : ""}`}>
            <span className="field__lbl">WHAT DO I CALL YOU</span>
            <input
              name="name" type="text" autoComplete="name"
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={errors.name ? errId("name") : undefined}
            />
            {errors.name && <span className="field__err" id={errId("name")}>{errors.name}</span>}
          </label>
          <label className={`field${errors.email ? " field--invalid" : ""}`}>
            <span className="field__lbl">WHERE DO I REPLY</span>
            <input
              name="email" type="email" autoComplete="email"
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? errId("email") : undefined}
            />
            {errors.email && <span className="field__err" id={errId("email")}>{errors.email}</span>}
          </label>
        </div>

        <fieldset className="field field--full">
          <legend className="field__lbl">PROJECT TYPE</legend>
          <div className="seg">
            {TYPES.map((t, i) => (
              <label className="seg__opt" key={t}>
                <input type="radio" name="type" value={t} defaultChecked={i === 0} />
                <span>{t}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="field field--full">
          <span className="field__lbl">ROUGH SCOPE</span>
          <div className="scope">
            <div className="scope__track" aria-hidden="true"></div>
            <div className="scope__ticks" aria-hidden="true">
              {SCOPE_LABELS.map((s) => <span key={s}></span>)}
            </div>
            <div className="scope__handle" aria-hidden="true" style={{ left: `${(scope / 4) * 100}%` }}></div>
            <input
              className="scope__input"
              type="range" min={0} max={4} step={1}
              value={scope}
              onChange={(e) => setScope(Number(e.target.value))}
              aria-label="Rough scope"
              aria-valuetext={SCOPE_VALUES[scope]}
            />
            <div className="scope__labels" aria-hidden="true">
              {SCOPE_LABELS.map((s) => <span key={s}>{s}</span>)}
            </div>
          </div>
          <div className="scope__value">{SCOPE_VALUES[scope]}</div>
        </div>

        <label className={`field field--full field--last${errors.brief ? " field--invalid" : ""}`}>
          <span className="field__lbl">THE BRIEF — WHAT IS BROKEN, OR WHAT SHOULD EXIST</span>
          <textarea
            name="brief" rows={5}
            aria-invalid={errors.brief ? true : undefined}
            aria-describedby={errors.brief ? errId("brief") : undefined}
          />
          {errors.brief && <span className="field__err" id={errId("brief")}>{errors.brief}</span>}
        </label>

        {/* Honeypot — hidden from sighted users and assistive tech alike. */}
        <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
          <label>
            Company
            <input name="company" type="text" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
      </div>

      <div className="form__actions">
        <button type="submit" className="btn-solid" disabled={state === "sending"}>
          {state === "sending" ? "SENDING…" : "SEND IT"}
        </button>
        <span className="form__status" role="alert">
          {firstError ?? (state === "failed" ? "That did not send. Try again, or email me directly." : "")}
        </span>
      </div>
    </form>
  );
}
