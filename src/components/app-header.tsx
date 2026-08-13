import Link from "next/link";

export function AppHeader({ active }: { active: "results" | "parameters" }) {
  const tab =
    "rounded-full px-4 py-1.5 text-sm font-bold no-underline transition";
  const on = "bg-white text-slate-950 shadow-[0_0_24px_rgba(255,255,255,0.15)]";
  const off =
    "border border-white/15 bg-white/5 text-slate-100 hover:bg-white/10";

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#070b14]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-white px-2 py-1.5">
            <img src="/logo.png" alt="Natural State Council" className="h-8 w-auto" />
          </div>
          <div className="hidden sm:block">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-teal-300">
              Scouting America · Arkansas
            </p>
            <h1 className="text-lg font-black tracking-tight text-white">
              Grant command
            </h1>
          </div>
        </div>
        <nav className="flex flex-wrap items-center gap-2">
          <Link href="/" className={`${tab} ${active === "results" ? on : off}`}>
            Portfolio
          </Link>
          <Link
            href="/parameters"
            className={`${tab} ${active === "parameters" ? on : off}`}
          >
            Search parameters
          </Link>
        </nav>
      </div>
    </header>
  );
}
