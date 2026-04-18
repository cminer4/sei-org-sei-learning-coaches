"use client";

import { signIn } from "next-auth/react";

/**
 * Stub sign-in for local dev. With placeholder Entra env vars, Microsoft sign-in
 * will not complete until real app registration values are provided.
 */
export default function SignInPage() {
  return (
    <main className="mx-auto flex max-w-lg flex-col gap-6 p-8">
      <h1 className="text-xl font-semibold">Sign in (development)</h1>
      <p className="text-sm text-neutral-600">
        Local builds use placeholder Azure AD values. Sign-in with Microsoft only
        works after real Entra app registration and secrets are configured.
      </p>
      <button
        type="button"
        className="rounded bg-neutral-900 px-4 py-2 text-white"
        onClick={() => signIn("azure-ad")}
      >
        Sign in with Microsoft
      </button>
    </main>
  );
}
