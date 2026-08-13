import Link from "next/link";

export function AppHeader({ active }: { active: "results" | "parameters" }) {
  const tab =
    "rounded px-3 py-1.5 text-sm font-bold no-underline transition-colors";
  const on = "bg-[#ce202a] text-white";
  const off = "text-[#255097] hover:bg-[#AFD4FF]/50";

  return (
    <header className="border-b-4 border-[#ce202a] bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="Natural State Council" className="h-12 w-auto" />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#255097]">
              Scouting America · Arkansas
            </p>
            <h1 className="text-xl font-black text-[#383636]">Grant Finder</h1>
          </div>
        </div>
        <nav className="flex items-center gap-2">
          <Link href="/" className={`${tab} ${active === "results" ? on : off}`}>
            Results
          </Link>
          <Link
            href="/parameters"
            className={`${tab} ${active === "parameters" ? on : off}`}
          >
            Search parameters
          </Link>
          <a
            href="https://www.naturalstatecouncil.org/"
            className="ml-2 text-sm font-bold"
            target="_blank"
            rel="noreferrer"
          >
            naturalstatecouncil.org
          </a>
        </nav>
      </div>
    </header>
  );
}
