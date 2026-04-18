import { auth } from "@/auth";

export default async function GuideHomePage() {
  const session = await auth();
  return (
    <main className="mx-auto max-w-lg p-8">
      <h1 className="text-xl font-semibold">Guide (protected)</h1>
      <p className="mt-2 text-sm">
        Signed in as: {session?.user?.email ?? session?.user?.name ?? "unknown"}
      </p>
    </main>
  );
}
