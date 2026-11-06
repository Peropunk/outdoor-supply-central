import "server-only";

// Order emails. They send through Resend once RESEND_API_KEY and EMAIL_FROM
// are set (on JD's domain, see SETUP.md); until then each one is logged so
// the flow can still be tested.

export type Email = { to: string; subject: string; text: string };

export async function sendEmail(email: Email) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) {
    console.info(`[email not sent: no RESEND_API_KEY] to=${email.to} subject="${email.subject}"`);
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: email.to, subject: email.subject, text: email.text }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) console.error(`[email failed] ${res.status} subject="${email.subject}"`);
  } catch {
    console.error(`[email failed] subject="${email.subject}"`);
  }
}
