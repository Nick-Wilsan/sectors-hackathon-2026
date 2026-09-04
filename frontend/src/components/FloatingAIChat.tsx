import { useState } from 'react';
import { askAboutEmiten } from '../api/client';

interface FloatingAIChatProps {
  symbol: string;
}

interface ChatEntry {
  question: string;
  answer: string;
}

const SUGGESTIONS = ['Apa arti Skor Komposit di atas?', 'Kenapa DER-nya segitu?', 'Jelaskan hasil framework investasinya'];

// Floating icon (fixed position, always reachable regardless of scroll/panel
// state) that opens a chat popup on click — replaces the old bottom-of-page
// panel per the request to keep AI reachable while browsing the chart.
export function FloatingAIChat({ symbol }: FloatingAIChatProps) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [history, setHistory] = useState<ChatEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        onClick={() => setOpen((o) => !o)}
        aria-label="Tanya AI tentang emiten ini"
        className="fixed right-4 top-16 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-brand text-neutral-950 shadow-lg hover:bg-brand-light"
      >
        {open ? '✕' : 'AI'}
      </button>

      {open && (
        <div className="fixed right-4 top-28 z-50 flex max-h-[70vh] w-80 flex-col overflow-hidden rounded-lg border border-neutral-700 bg-neutral-900 shadow-2xl sm:w-96">
          <div className="border-b border-neutral-800 px-3 py-2">
            <h2 className="text-sm font-medium text-neutral-200">Tanya AI — {symbol.toUpperCase()}</h2>
            <p className="mt-0.5 text-[11px] text-neutral-500">
              Berdasarkan data di halaman ini saja — bukan rekomendasi investasi.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-2">
            {history.length === 0 && (
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => submit(s)}
                    disabled={loading}
                    className="rounded-full border border-neutral-700 px-2.5 py-1 text-[11px] text-neutral-400 hover:border-neutral-500 hover:text-neutral-200 disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-2 space-y-3">
              {history.map((entry, i) => (
                <div key={i} className="rounded-md border border-neutral-800 bg-neutral-950 p-2.5">
                  <p className="text-xs font-medium text-neutral-200">{entry.question}</p>
                  <p className="mt-1.5 whitespace-pre-wrap text-xs text-neutral-400">{entry.answer}</p>
                </div>
              ))}
            </div>

            {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(question);
            }}
            className="flex gap-1.5 border-t border-neutral-800 p-2"
          >
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Tanya sesuatu..."
              disabled={loading}
              className="flex-1 rounded-md border border-neutral-700 bg-neutral-950 px-2.5 py-1.5 text-xs text-neutral-100 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-neutral-950 hover:bg-brand-light disabled:opacity-50"
            >
              {loading ? '...' : 'Kirim'}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
