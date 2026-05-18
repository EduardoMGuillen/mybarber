import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { OnboardingClient } from "./onboarding-client";

export const metadata = { title: "Configurar barbería" };

export default async function OnboardingPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return <OnboardingClient />;
}
