import { Dashboard } from "@/components/dashboard";
import { loadProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const profile = await loadProfile();
  return <Dashboard initialProfile={profile} />;
}
