const BASE =
  process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

export async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !secret) return null;

  const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) return null;
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export async function createSubscriptionApprovalUrl(returnUrl: string, cancelUrl: string) {
  const token = await getPayPalAccessToken();
  const planId = process.env.PAYPAL_PLAN_ID;
  if (!token || !planId) return null;

  const res = await fetch(`${BASE}/v1/billing/subscriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      plan_id: planId,
      application_context: {
        brand_name: "MiBarbería",
        user_action: "SUBSCRIBE_NOW",
        return_url: returnUrl,
        cancel_url: cancelUrl,
      },
    }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as { id: string; links: { rel: string; href: string }[] };
  const approve = data.links.find((l) => l.rel === "approve");
  return approve ? { url: approve.href, subscriptionId: data.id } : null;
}
