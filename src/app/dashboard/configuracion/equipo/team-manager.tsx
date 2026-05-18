"use client";

import { useState } from "react";
import Image from "next/image";
import {
  addStaffMember,
  toggleStaffActive,
  updateStaffMember,
} from "@/lib/actions/staff";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ui/image-upload";

type Member = {
  id: string;
  displayName: string;
  bio: string | null;
  photoUrl: string | null;
  active: boolean;
  acceptsOnlineBookings: boolean;
};

export function TeamManager({ initialTeam }: { initialTeam: Member[] }) {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await addStaffMember({
        displayName: name,
        bio: bio || undefined,
        acceptsOnlineBookings: true,
      });
      setName("");
      setBio("");
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al añadir");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleAdd}
        className="space-y-4 rounded-xl border border-white/10 p-4"
      >
        <h2 className="font-semibold text-brand-gold">Añadir barbero</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="displayName">Nombre</Label>
            <Input
              id="displayName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="bio">Bio (opcional)</Label>
            <Input
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={200}
              placeholder="Especialista en fades, 5 años de experiencia…"
            />
          </div>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? "Añadiendo…" : "Añadir barbero"}
        </Button>
      </form>

      <ul className="space-y-4">
        {initialTeam.map((m) => (
          <StaffCard key={m.id} member={m} />
        ))}
      </ul>
    </div>
  );
}

function StaffCard({ member }: { member: Member }) {
  const [displayName, setDisplayName] = useState(member.displayName);
  const [bio, setBio] = useState(member.bio ?? "");
  const [photoUrl, setPhotoUrl] = useState(member.photoUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await updateStaffMember({
        staffMemberId: member.id,
        displayName,
        bio: bio || undefined,
        acceptsOnlineBookings: member.acceptsOnlineBookings,
        photoUrl,
      });
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <li className="space-y-4 rounded-xl border border-white/10 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative h-14 w-14 overflow-hidden rounded-full border border-white/10 bg-brand-surface">
            {photoUrl ? (
              <Image
                src={photoUrl}
                alt={displayName}
                fill
                className="object-cover"
                sizes="56px"
                unoptimized
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-brand-text-muted">
                ?
              </div>
            )}
          </div>
          <span
            className={
              member.active ? "font-medium" : "text-brand-text-muted line-through"
            }
          >
            {member.displayName}
          </span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={async () => {
            await toggleStaffActive(member.id, !member.active);
            window.location.reload();
          }}
        >
          {member.active ? "Desactivar" : "Activar"}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Nombre público</Label>
          <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Bio</Label>
          <Input value={bio} onChange={(e) => setBio(e.target.value)} maxLength={200} />
        </div>
      </div>

      <ImageUpload
        label="Foto"
        kind="staff"
        staffMemberId={member.id}
        value={photoUrl}
        onChange={setPhotoUrl}
      />

      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="button" size="sm" disabled={saving} onClick={() => void save()}>
        {saving ? "Guardando…" : "Guardar cambios"}
      </Button>
    </li>
  );
}
