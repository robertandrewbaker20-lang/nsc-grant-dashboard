import type { Metadata } from "next";
import { PursuitBoard } from "@/components/pursuit-board";
import { loadProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Natural State Council · Pursuit board",
};

export default async function PursuePage() {
  const profile = await loadProfile();
  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6">
      <PursuitBoard initialProfile={profile} />
    </main>
  );
}
