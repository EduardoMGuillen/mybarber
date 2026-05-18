"use client";

import { useState } from "react";
import { addStaffMember, toggleStaffActive } from "@/lib/actions/staff";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Member = {
  id: string;
  displayName: string;
  active: boolean;
  acceptsOnlineBookings: boolean;
};

export function TeamManager({ initialTeam }: { initialTeam: Member[] }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await addStaffMember({ displayName: name, acceptsOnlineBookings: true });
      setName("");
      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleAdd} className="flex flex-wrap gap-3 rounded-xl border border-white/10 p-4">
        <div className="min-w-[200px] flex-1 space-y-2">
          <Label htmlFor="displayName">Nombre del barbero</Label>
          <Input id="displayName" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={loading}>
            Añadir
          </Button>
        </div>
      </form>

      <ul className="space-y-2">
        {initialTeam.map((m) => (
          <li
            key={m.id}
            className="flex items-center justify-between rounded-lg border border-white/10 px-4 py-3"
          >
            <span className={m.active ? "" : "text-brand-text-muted line-through"}>
              {m.displayName}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={async () => {
                await toggleStaffActive(m.id, !m.active);
                window.location.reload();
              }}
            >
              {m.active ? "Desactivar" : "Activar"}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
