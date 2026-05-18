"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getPasswordStrength,
  STRENGTH_BAR_COLORS,
} from "@/lib/auth/password-strength";
import { cn } from "@/lib/utils";

type PasswordFieldProps = {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  showStrength?: boolean;
  labelAction?: ReactNode;
};

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}

export function PasswordField({
  id: idProp,
  label,
  value,
  onChange,
  autoComplete,
  required,
  minLength,
  showStrength = false,
  labelAction,
}: PasswordFieldProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const strengthId = `${id}-strength`;
  const [visible, setVisible] = useState(false);

  const strength = useMemo(
    () => (showStrength ? getPasswordStrength(value) : null),
    [showStrength, value],
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {labelAction}
      </div>

      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          minLength={minLength}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-brand-text-muted transition-colors hover:text-brand-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={visible}
        >
          {visible ? (
            <EyeOffIcon className="h-4 w-4" />
          ) : (
            <EyeIcon className="h-4 w-4" />
          )}
        </button>
      </div>

      {showStrength && strength && value.length > 0 && (
        <div className="space-y-2" id={strengthId} aria-live="polite">
          <div className="flex items-center gap-2">
            <div className="flex flex-1 gap-1">
              {[1, 2, 3, 4].map((segment) => (
                <div
                  key={segment}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-colors duration-300",
                    segment <= strength.score
                      ? STRENGTH_BAR_COLORS[strength.score]
                      : "bg-white/10",
                  )}
                />
              ))}
            </div>
            <span
              className={cn(
                "text-xs font-medium tabular-nums",
                strength.score <= 1 && "text-red-400",
                strength.score === 2 && "text-orange-400",
                strength.score === 3 && "text-brand-gold",
                strength.score === 4 && "text-green-400",
              )}
            >
              {strength.label}
            </span>
          </div>
          <ul className="grid gap-1 text-xs text-brand-text-muted sm:grid-cols-3">
            {strength.checks.map((check) => (
              <li
                key={check.id}
                className={cn(
                  "flex items-center gap-1.5",
                  check.met && "text-brand-text",
                )}
              >
                <span
                  className={cn(
                    "inline-block h-1.5 w-1.5 shrink-0 rounded-full",
                    check.met ? "bg-green-500" : "bg-white/20",
                  )}
                  aria-hidden
                />
                {check.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
