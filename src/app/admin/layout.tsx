import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { BrandLogo } from "@/components/brand/brand-logo";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { isSuperadmin } from "@/lib/auth/guards";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!isSuperadmin(session)) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-white/10 bg-brand-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <BrandLogo size="sm" href="/admin" />
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/admin" className="hover:text-brand-gold">
              Barberías
            </Link>
            <span className="text-brand-text-muted">{session?.user?.email}</span>
            <SignOutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {children}
      </main>
    </div>
  );
}
