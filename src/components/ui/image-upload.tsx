"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type Props = {
  label: string;
  value?: string | null;
  onChange: (url: string) => void;
  kind: "logo" | "staff";
  staffMemberId?: string;
  shopId?: string;
  hint?: string;
};

export function ImageUpload({
  label,
  value,
  onChange,
  kind,
  staffMemberId,
  shopId,
  hint,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("kind", kind);
      if (kind === "staff" && staffMemberId) {
        body.append("staffMemberId", staffMemberId);
      }
      if (shopId) {
        body.append("shopId", shopId);
      }

      const res = await fetch("/api/upload", { method: "POST", body });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "No se pudo subir la imagen");
      if (!data.url) throw new Error("Respuesta inválida del servidor");
      onChange(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al subir");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-white/10 bg-brand-surface">
          {value ? (
            <Image
              src={value}
              alt=""
              fill
              className="object-cover"
              sizes="80px"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-brand-text-muted">
              Sin foto
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading || (kind === "staff" && !staffMemberId)}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? "Subiendo…" : value ? "Cambiar imagen" : "Subir imagen"}
          </Button>
          {kind === "staff" && !staffMemberId && (
            <p className="text-xs text-amber-400/90">
              Guarda el barbero primero para subir foto.
            </p>
          )}
        </div>
      </div>
      {hint && <p className="text-xs text-brand-text-muted">{hint}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
