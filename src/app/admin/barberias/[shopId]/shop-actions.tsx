"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { updateShopStatus } from "@/lib/actions/shops";
import { getTrialEndsAt } from "@/lib/shops/defaults";

type Props = {
  shopId: string;
  status: string;
};

export function ShopActions({ shopId, status }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: string, fn: () => Promise<unknown>) {
    setLoading(action);
    setError(null);
    try {
      await fn();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      {status !== "suspended" && (
        <Button
          variant="destructive"
          size="sm"
          disabled={!!loading}
          onClick={() =>
            run("suspend", () => updateShopStatus(shopId, "suspended"))
          }
        >
          {loading === "suspend" ? "…" : "Suspender"}
        </Button>
      )}
      {status === "suspended" && (
        <Button
          size="sm"
          disabled={!!loading}
          onClick={() => run("active", () => updateShopStatus(shopId, "active"))}
        >
          {loading === "active" ? "…" : "Reactivar"}
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        disabled={!!loading}
        onClick={() =>
          run("trial", () =>
            updateShopStatus(shopId, "trial", { trialEndsAt: getTrialEndsAt() }),
          )
        }
      >
        {loading === "trial" ? "…" : "Extender trial"}
      </Button>
      {error && <p className="w-full text-sm text-red-400">{error}</p>}
    </div>
  );
}
