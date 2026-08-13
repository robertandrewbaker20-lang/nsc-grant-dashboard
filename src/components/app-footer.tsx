export function AppFooter() {
  return (
    <footer className="mt-auto bg-nsc-navy-deep text-white">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-start justify-between gap-6 px-4 py-8 sm:px-6">
        <div>
          <p className="font-display text-sm font-bold uppercase tracking-[0.16em]">
            Natural State Council
          </p>
          <p className="mt-1 text-sm text-white/80">Scouting America · Grant Finder</p>
          <p className="mt-3 text-sm leading-relaxed text-white/75">
            3220 Cantrell Road
            <br />
            Little Rock, Arkansas 72202
          </p>
        </div>
        <div className="text-sm leading-relaxed">
          <p>
            <a href="tel:5016644780" className="text-white no-underline hover:underline">
              (501) 664-4780
            </a>
          </p>
          <p className="mt-1">
            <a
              href="mailto:NaturalStateBSA@scouting.org"
              className="text-white no-underline hover:underline"
            >
              NaturalStateBSA@scouting.org
            </a>
          </p>
          <p className="mt-3">
            <a
              href="https://www.naturalstatecouncil.org/"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-white underline decoration-white/40 underline-offset-4 hover:decoration-white"
            >
              naturalstatecouncil.org
            </a>
          </p>
        </div>
      </div>
      <div className="bg-nsc-red px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
        Preparing Arkansas youth for a successful life
      </div>
    </footer>
  );
}
