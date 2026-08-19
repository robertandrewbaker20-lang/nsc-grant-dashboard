"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

function navClass(active: boolean) {
  return [
    "relative px-4 py-[15px] text-[13px] font-bold uppercase tracking-[0.08em] no-underline transition-colors",
    active
      ? "bg-[#eeeeee] text-[#ce202a] shadow-[inset_0_-3px_0_0_#ce202a]"
      : "text-[#7b7676] hover:bg-[#eeeeee] hover:text-[#ce202a]",
  ].join(" ");
}

export function AppHeader() {
  const pathname = usePathname();
  const onPortfolio = pathname === "/";
  const onPursue = pathname.startsWith("/pursue");
  const onParameters = pathname.startsWith("/parameters");

  return (
    <header className="sticky top-0 z-30 shadow-[0_1px_0_rgba(0,0,0,0.06)]">
      <div className="bg-nsc-red text-white">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-[7px] text-[13px] sm:px-6">
          <p className="min-w-0 truncate">
            <a href="tel:5016644780" className="text-white no-underline hover:underline">
              (501) 664-4780
            </a>
            <span className="mx-2 opacity-70">|</span>
            <a
              href="mailto:NaturalStateBSA@scouting.org"
              className="text-white no-underline hover:underline"
            >
              NaturalStateBSA@scouting.org
            </a>
          </p>
          <p className="hidden shrink-0 font-display text-[12px] font-semibold uppercase tracking-[0.16em] sm:block">
            Arkansas · Scouting America
          </p>
        </div>
      </div>

      <div className="border-b border-[#e6e6e6] bg-white">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-4 no-underline">
            <Image
              src="/logo.png"
              alt="Scouting America — Natural State Council"
              width={760}
              height={150}
              priority
              className="h-12 w-auto sm:h-[58px]"
            />
            <div className="hidden border-l border-line pl-4 md:block">
              <p className="font-display text-[11px] font-bold uppercase tracking-[0.2em] text-nsc-navy-link">
                Staff tool
              </p>
              <p className="text-lg font-bold leading-tight tracking-tight text-ink">
                Grant Finder
              </p>
            </div>
          </Link>

          <a
            href="https://www.naturalstatecouncil.org/"
            target="_blank"
            rel="noreferrer"
            className="rounded-t-md bg-nsc-navy-link px-3.5 py-1.5 font-display text-sm font-bold uppercase tracking-wide text-white no-underline transition-colors hover:bg-[#014274]"
          >
            Council website
          </a>
        </div>
      </div>

      <nav className="border-b border-[#ccc] bg-nav" aria-label="Grant Finder">
        <div className="mx-auto flex max-w-[1400px] px-2 sm:px-4">
          <Link href="/" className={navClass(onPortfolio)} aria-current={onPortfolio ? "page" : undefined}>
            Portfolio
          </Link>
          <Link
            href="/pursue"
            className={navClass(onPursue)}
            aria-current={onPursue ? "page" : undefined}
          >
            Pursuit board
          </Link>
          <Link
            href="/parameters"
            className={navClass(onParameters)}
            aria-current={onParameters ? "page" : undefined}
          >
            Search parameters
          </Link>
        </div>
      </nav>
    </header>
  );
}
