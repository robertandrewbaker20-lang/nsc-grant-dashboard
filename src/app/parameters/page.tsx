import { AppHeader } from "@/components/app-header";
import { ParametersForm } from "@/components/parameters-form";
import { loadProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

export default async function ParametersPage() {
  const profile = await loadProfile();
  return (
    <div className="min-h-screen text-slate-100">
      <AppHeader active="parameters" />
      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
        <ParametersForm initialProfile={profile} />
      </main>
    </div>
  );
}
