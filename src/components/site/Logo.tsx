import { cn } from "@/lib/utils";

export function Monogram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("h-10 w-10", className)} aria-hidden="true">
      <circle cx="32" cy="32" r="30" className="fill-primary" />
      <circle cx="32" cy="32" r="26.5" fill="none" className="stroke-primary-foreground/60" strokeWidth="0.8" />
      <text
        x="32"
        y="40"
        textAnchor="middle"
        className="fill-primary-foreground"
        style={{ fontFamily: "var(--font-display)", fontSize: 22, fontStyle: "italic", fontWeight: 600 }}
      >
        FJS
      </text>
      {/* resin charm drop */}
      <path d="M49 9c2.6 3.4 3.8 5.6 3.8 7.4a3.8 3.8 0 0 1-7.6 0c0-1.8 1.2-4 3.8-7.4Z" className="fill-blush stroke-primary-foreground" strokeWidth="1" />
    </svg>
  );
}

export function Logo({ withTagline = false, className }: { withTagline?: boolean; className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5 animate-logo-reveal", className)}>
      <Monogram />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[15px] font-semibold tracking-[0.18em] text-rose sm:text-base">
          FOLA JUNK SYNDICATE
        </span>
        {withTagline && (
          <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Made with love, charms & resin magic
          </span>
        )}
      </span>
    </span>
  );
}
