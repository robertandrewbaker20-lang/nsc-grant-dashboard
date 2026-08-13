import { Dashboard } from "@/components/dashboard";
import { loadProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const profile = await loadProfile();
  return (
    <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
      <Dashboard initialProfile={profile} />
    </main>
  );
}
