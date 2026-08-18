"use server";

import { signIn } from "@/auth";

export async function signInWithMicrosoft(callbackUrl?: string) {
  await signIn("microsoft-entra-id", { redirectTo: callbackUrl || "/" });
}

export async function signInAsDevUser(email: string, callbackUrl?: string) {
  await signIn("dev-login", { email, redirectTo: callbackUrl || "/" });
}
