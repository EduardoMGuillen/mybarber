"use client";

import { useRef } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { Button } from "@/components/ui/button";

export type BookingConfirmationData = {
  shopName: string;
  serviceName: string;
  staffName: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  startAt: string;
  timezone: string;
  status: string;
};

export function BookingConfirmationCard({
  data,
}: {
  data: BookingConfirmationData;
}) {
  const ticketRef = useRef<HTMLDivElement>(null);

  let when: string;
  try {
    when = formatInTimeZone(
      new Date(data.startAt),
      data.timezone || "America/Tegucigalpa",
      "EEEE d 'de' MMMM yyyy · HH:mm",
    );
  } catch {
    when = new Date(data.startAt).toLocaleString("es-HN");
  }

  const statusLabel =
    data.status === "confirmed" ? "Confirmada" : "Pendiente de confirmación";

  function handlePrint() {
    window.print();
  }

  function handleDownloadImage() {
    const el = ticketRef.current;
    if (!el) return;

    const canvas = document.createElement("canvas");
    const width = 400;
    const height = 520;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "#c9a227";
    ctx.lineWidth = 2;
    ctx.strokeRect(16, 16, width - 32, height - 32);

    let y = 56;
    const line = (text: string, size: number, color: string, bold = false) => {
      ctx.fillStyle = color;
      ctx.font = `${bold ? "bold " : ""}${size}px system-ui, sans-serif`;
      const lines = wrapText(ctx, text, width - 64);
      for (const ln of lines) {
        ctx.fillText(ln, 32, y);
        y += size + 8;
      }
    };

    line("MiBarbería", 14, "#c9a227");
    line(data.shopName, 22, "#f5f5f5", true);
    y += 8;
    line(statusLabel, 13, "#a3a3a3");
    y += 4;
    line(data.serviceName, 16, "#f5f5f5", true);
    line(`Barbero: ${data.staffName}`, 14, "#a3a3a3");
    line(when, 14, "#f5f5f5");
    y += 8;
    line(data.clientName, 15, "#f5f5f5", true);
    line(data.clientPhone, 13, "#a3a3a3");
    line(data.clientEmail, 13, "#a3a3a3");

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reserva-${data.shopName.replace(/\s+/g, "-").toLowerCase()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  return (
    <div className="space-y-6">
      <div
        ref={ticketRef}
        className="booking-ticket rounded-2xl border border-brand-gold/30 bg-brand-surface p-6 text-left shadow-[0_0_40px_rgba(201,162,39,0.12)]"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-gold">
          Comprobante de reserva
        </p>
        <h2 className="mt-2 text-xl font-bold">{data.shopName}</h2>
        <p className="mt-1 text-sm text-brand-text-muted">{statusLabel}</p>

        <dl className="mt-6 space-y-3 text-sm">
          <div>
            <dt className="text-brand-text-muted">Servicio</dt>
            <dd className="font-medium">{data.serviceName}</dd>
          </div>
          <div>
            <dt className="text-brand-text-muted">Barbero</dt>
            <dd className="font-medium">{data.staffName}</dd>
          </div>
          <div>
            <dt className="text-brand-text-muted">Fecha y hora</dt>
            <dd className="font-medium capitalize">{when}</dd>
          </div>
          <div>
            <dt className="text-brand-text-muted">Cliente</dt>
            <dd className="font-medium">{data.clientName}</dd>
            <dd className="text-brand-text-muted">{data.clientPhone}</dd>
            <dd className="text-brand-text-muted">{data.clientEmail}</dd>
          </div>
        </dl>
      </div>

      <p className="text-center text-sm text-brand-text-muted">
        También enviamos los detalles a <strong>{data.clientEmail}</strong>.
      </p>

      <p className="rounded-lg border border-brand-gold/25 bg-brand-gold/10 px-4 py-3 text-center text-sm font-medium text-brand-gold print:hidden">
        Toma captura de tu reserva
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center print:hidden">
        <Button type="button" variant="outline" onClick={handleDownloadImage}>
          Descargar imagen
        </Button>
        <Button type="button" onClick={handlePrint}>
          Guardar PDF
        </Button>
      </div>
    </div>
  );
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [text];
}
