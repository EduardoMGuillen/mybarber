import { Resend } from "resend";

let resend: Resend | null = null;

export function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!resend) resend = new Resend(key);
  return resend;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const client = getResend();
  const from =
    process.env.RESEND_FROM_EMAIL ?? "MiBarbería <noreply@mibarberia.dev>";

  if (!client) {
    console.log("[email:dev]", { to, subject });
    return { id: "dev-mode" };
  }

  const { data, error } = await client.emails.send({ from, to, subject, html });
  if (error) throw new Error(error.message);
  return data;
}
