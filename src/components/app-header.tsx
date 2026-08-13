import Link from "next/link";

export function AppHeader({ active }: { active: "results" | "parameters" }) {
  const tab = "rounded-md px-3 py-1.5 text-sm font-bold no-underline transition-colors";
  const on = "bg-[#ce202a] text-white shadow-sm";
  const off = "text-[#255097] hover:bg-[#e8f2ff]";

  return (
    <header className="sticky top-0 z-30 border-b border-[#d5deea] bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="Natural State Council" className="h-11 w-auto" />
          <div className="hidden border-l border-[#d5deea] pl-4 sm:block">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#255097]">
              Scouting America · Arkansas
            </p>
            <h1 className="text-lg font-black tracking-tight text-[#1c2430]">
              Funding intelligence
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
            className="hidden text-xs font-bold text-[#5c6776] no-underline hover:text-[#ce202a] sm:inline"
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
