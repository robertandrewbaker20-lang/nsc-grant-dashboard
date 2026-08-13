import { ParametersForm } from "@/components/parameters-form";
import { loadProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

export default async function ParametersPage() {
  const profile = await loadProfile();
  return (
    <main className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6">
      <ParametersForm initialProfile={profile} />
    </main>
  );
}
