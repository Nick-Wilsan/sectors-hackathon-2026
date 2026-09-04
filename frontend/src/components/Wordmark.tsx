interface WordmarkProps {
  className?: string;
}

// Typography-only identity: Space Grotesk wordmark + one plain geometric
// accent (a bar — a nod to a ticker/candle body, never an illustration or
// custom icon). No mascot, no logomark beyond this primitive.
export function Wordmark({ className = '' }: WordmarkProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span aria-hidden className="h-4 w-1.5 shrink-0 rounded-sm bg-brand" />
      <span className="font-wordmark text-lg font-bold tracking-tight text-neutral-100">Stocket</span>
    </span>
  );
}
