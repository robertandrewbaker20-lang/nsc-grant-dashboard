import Link from "next/link";

export function AppHeader({ active }: { active: "results" | "parameters" }) {
  const tab = "rounded-full px-4 py-1.5 text-sm font-bold no-underline transition";
  const on = "bg-[#255097] text-white";
  const off =
    "border border-[#255097]/20 bg-white text-[#255097] hover:bg-[#AFD4FF]/40";

  return (
    <header className="sticky top-0 z-30 border-b-4 border-[#ce202a] bg-white/90 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="Natural State Council" className="h-11 w-auto" />
          <div className="hidden border-l border-[#afd4ff] pl-4 sm:block">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#255097]">
              Scouting America · Arkansas
            </p>
            <h1 className="text-lg font-black tracking-tight text-[#383636]">
              Grant Finder
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
          <a
            href="https://www.naturalstatecouncil.org/"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-[#ce202a]/20 px-3 py-1.5 text-sm font-bold text-[#ce202a] no-underline hover:bg-[#ce202a]/5"
          >
            naturalstatecouncil.org
          </a>
        </nav>
      </div>
    </header>
  );
}
