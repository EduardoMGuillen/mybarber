export type PasswordStrengthLevel = 0 | 1 | 2 | 3 | 4;

export type PasswordStrength = {
  score: PasswordStrengthLevel;
  label: string;
  percent: number;
  meetsPolicy: boolean;
  checks: { id: string; label: string; met: boolean }[];
};

const CHECKS = [
  { id: "length", label: "Al menos 8 caracteres", test: (p: string) => p.length >= 8 },
  { id: "upper", label: "Una mayúscula", test: (p: string) => /[A-Z]/.test(p) },
  { id: "number", label: "Un número", test: (p: string) => /[0-9]/.test(p) },
] as const;

export function getPasswordStrength(password: string): PasswordStrength {
  const checks = CHECKS.map((c) => ({
    id: c.id,
    label: c.label,
    met: c.test(password),
  }));

  const metCount = checks.filter((c) => c.met).length;
  const meetsPolicy = metCount === checks.length;

  if (!password) {
    return {
      score: 0,
      label: "",
      percent: 0,
      meetsPolicy: false,
      checks,
    };
  }

  const hasExtra =
    password.length >= 12 || /[^A-Za-z0-9]/.test(password) || /[a-z]/.test(password);

  let score: PasswordStrengthLevel;
  let label: string;
  let percent: number;

  if (!meetsPolicy) {
    if (metCount <= 1) {
      score = 1;
      label = "Débil";
      percent = 25;
    } else {
      score = 2;
      label = "Regular";
      percent = 50;
    }
  } else if (hasExtra && password.length >= 12) {
    score = 4;
    label = "Fuerte";
    percent = 100;
  } else {
    score = 3;
    label = "Buena";
    percent = 75;
  }

  return { score, label, percent, meetsPolicy, checks };
}

export const STRENGTH_BAR_COLORS: Record<PasswordStrengthLevel, string> = {
  0: "bg-white/10",
  1: "bg-red-500",
  2: "bg-orange-400",
  3: "bg-brand-gold",
  4: "bg-green-500",
};
