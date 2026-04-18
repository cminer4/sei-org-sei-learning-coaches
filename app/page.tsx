import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex max-w-lg flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold">SEI Assessment Coach</h1>
      <p className="text-sm text-neutral-600">
        Internal learning tool. Use Sign in for Microsoft (Entra), or open Guide
        when authenticated.
      </p>
      <nav className="flex flex-col gap-2 text-blue-600 underline">
        <Link href="/signin">Sign in</Link>
        <Link href="/guide">Guide (protected)</Link>
      </nav>
    </main>
  );
}
