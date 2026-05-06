export default function AnnouncementBar() {
  return (
    <div className="sticky top-0 z-50 bg-black-deep border-b border-white/10 backdrop-blur supports-[backdrop-filter]:bg-black-deep/85">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12 h-10 flex items-center justify-between gap-4 text-[11px] sm:text-xs font-mono uppercase tracking-[0.18em] text-white/70">
        <div className="flex items-center gap-2.5 truncate">
          <span
            aria-hidden
            className="inline-flex h-1.5 w-1.5 shrink-0 rounded-full bg-orange-safety shadow-[0_0_12px_rgba(255,140,0,0.65)]"
          />
          <span className="truncate">
            Now opening · selective intake by trade + area
          </span>
        </div>
        <a
          href="#apply"
          className="hidden sm:inline-flex items-center gap-1.5 text-orange-safety hover:text-white transition-colors"
        >
          Apply for early access
          <span aria-hidden>→</span>
        </a>
      </div>
    </div>
  );
}
