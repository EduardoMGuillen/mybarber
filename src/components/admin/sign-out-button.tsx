"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => void signOut({ callbackUrl: "/", redirect: true })}
    >
      Cerrar sesión
    </Button>
  );
}
