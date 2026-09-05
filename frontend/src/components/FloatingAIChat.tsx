import { useEffect, useRef, useState } from 'react';
import { askAboutEmiten } from '../api/client';

interface FloatingAIChatProps {
  /** The AI only ever answers about one emiten's already-computed data; this names it. */
  symbol: string;
  /** Starter questions, tailored to the page the launcher sits on. */
  suggestions?: string[];
}

interface ChatEntry {
  question: string;
  answer: string;
}

const DEFAULT_SUGGESTIONS = ['Apa arti Skor Komposit di atas?', 'Kenapa DER-nya segitu?', 'Jelaskan hasil framework investasinya'];

/**
 * Gemini replies in light markdown, which previously rendered as literal
 * `**asterisks**` and `* ` bullets. This renders just those two constructs as
 * React nodes — no HTML injection, and no markdown dependency for a feature
 * that only ever needs bold and bullets.
 */
function AnswerText({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="mt-space-4 flex flex-col gap-space-2 font-body-sm text-body-sm leading-relaxed text-text-secondary">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (trimmed === '') return null;
        const bullet = /^[*-]\s+/.test(trimmed);
        const content = bullet ? trimmed.replace(/^[*-]\s+/, '') : trimmed;
        return (
          <p key={i} className={bullet ? 'relative pl-space-12 before:absolute before:left-space-4 before:content-["\\2022"]' : undefined}>
            {content.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
              part.startsWith('**') && part.endsWith('**') ? (
                <strong key={j} className="font-semibold text-text-primary">
                  {part.slice(2, -2)}
                </strong>
              ) : (
                part
              ),
            )}
          </p>
        );
      })}
    </div>
  );
}

// Floating launcher docked to the bottom-right corner — the conventional spot,
// and above the sticky disclaimer bar so the two never overlap. Kept fixed so
// the AI stays reachable no matter how far down the dashboard you have scrolled.
export function FloatingAIChat({ symbol, suggestions = DEFAULT_SUGGESTIONS }: FloatingAIChatProps) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [history, setHistory] = useState<ChatEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep the newest answer in view; long Gemini replies otherwise land below
  // the fold of the panel and look like nothing happened.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history, loading]);

  // Escape closes the panel — it covers content, so it needs a keyboard exit.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  async function submit(q: string) {
    if (!q.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const answer = await askAboutEmiten(symbol, q);
      setHistory((h) => [...h, { question: q, answer }]);
      setQuestion('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mendapat jawaban dari AI');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Tutup asisten AI' : `Tanya AI tentang ${symbol.toUpperCase()}`}
        aria-expanded={open}
        className="fixed bottom-20 right-space-16 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-primary-container bg-primary-container text-background-base shadow-[0_8px_24px_rgba(0,0,0,0.55)] transition-colors hover:bg-accent-hover active:scale-[0.96]"
      >
        <span className="material-symbols-outlined text-[22px]">{open ? 'close' : 'smart_toy'}</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={`Tanya AI tentang ${symbol.toUpperCase()}`}
          className="fixed bottom-36 right-space-16 z-50 flex max-h-[min(520px,calc(100vh-14rem))] w-[min(92vw,384px)] flex-col overflow-hidden rounded-xl border border-surface-variant bg-surface-card shadow-[0_12px_32px_rgba(0,0,0,0.65)]"
        >
          <div className="flex items-start justify-between gap-space-8 border-b border-border-subtle px-space-12 py-space-8">
            <div>
              <h2 className="font-headline-sm text-headline-sm font-bold text-text-primary">
                Tanya AI &middot; <span className="text-primary">{symbol.toUpperCase()}</span>
              </h2>
              <p className="font-body-sm text-body-sm text-text-muted">
                Hanya menjelaskan data yang sudah dihitung di halaman ini &mdash; bukan rekomendasi investasi.
              </p>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-space-12 py-space-8">
            {history.length === 0 && !loading && (
              <div className="flex flex-wrap gap-space-4">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => submit(s)}
                    disabled={loading}
                    className="rounded border border-border-subtle bg-surface-container-lowest px-space-8 py-space-4 text-left font-body-sm text-body-sm text-text-secondary transition-colors hover:border-surface-variant hover:text-text-primary disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-space-8">
              {history.map((entry, i) => (
                <div key={i} className="rounded border border-border-subtle/60 bg-surface-container-lowest p-space-8">
                  <p className="font-body-sm text-body-sm font-semibold text-text-primary">{entry.question}</p>
                  <AnswerText text={entry.answer} />
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-space-8 rounded border border-border-subtle/60 bg-surface-container-lowest p-space-8">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-primary-container" />
                  <span className="font-body-sm text-body-sm text-text-muted">Menyusun jawaban dari data halaman ini...</span>
                </div>
              )}
            </div>

            {error && (
              <p className="mt-space-8 rounded border border-state-negative/40 bg-state-negative/10 px-space-8 py-space-6 font-body-sm text-body-sm text-state-negative">
                {error}
              </p>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(question);
            }}
            className="flex gap-space-6 border-t border-border-subtle p-space-8"
          >
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Tanya sesuatu..."
              disabled={loading}
              className="h-[32px] flex-1 rounded border border-border-subtle bg-surface-container-lowest px-space-8 font-body-sm text-body-sm text-text-primary transition-colors placeholder:text-text-muted focus:border-primary-container focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="flex h-[32px] items-center gap-space-4 rounded bg-primary-container px-space-12 font-body-sm text-body-sm font-bold text-background-base transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">send</span>
              Kirim
            </button>
          </form>
        </div>
      )}
    </>
  );
}
