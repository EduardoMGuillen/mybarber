import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { auth } from "@/lib/auth";
import { getShopForUser } from "@/lib/tenant";
import { CopyLinkButton } from "@/components/dashboard/copy-link-button";

export const metadata = { title: "Mi enlace" };

export default async function EnlacePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const shop = await getShopForUser(
    session.user.id,
    session.user.role ?? "owner",
  );
  if (!shop) {
    return (
      <p className="text-brand-text-muted">
        Completa el onboarding para obtener tu enlace público.
      </p>
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const publicUrl = `${appUrl}/${shop.slug}`;
  const qrDataUrl = await QRCode.toDataURL(publicUrl, {
    margin: 2,
    color: { dark: "#0a0a0a", light: "#ffffff" },
  });

  return (
    <div className="space-y-8 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold">Mi enlace</h1>
        <p className="text-brand-text-muted">
          Comparte tu landing y reservas con clientes.
        </p>
      </div>

      <div className="rounded-xl border border-brand-gold/30 bg-brand-gold/10 p-6 space-y-4">
        <p className="break-all font-mono text-sm text-brand-gold">{publicUrl}</p>
        <CopyLinkButton url={publicUrl} />
        <p className="text-sm">
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-gold hover:underline"
          >
            Ver página pública →
          </a>
        </p>
      </div>

      <div className="flex flex-col items-center gap-4 rounded-xl border border-white/10 bg-brand-surface p-6">
        <h2 className="font-semibold text-brand-gold">Código QR</h2>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrDataUrl} alt="QR de tu barbería" width={200} height={200} />
        <p className="text-center text-xs text-brand-text-muted">
          Imprime o comparte en redes para que escaneen y reserven.
        </p>
      </div>
    </div>
  );
}
