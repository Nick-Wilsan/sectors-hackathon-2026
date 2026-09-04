import { useState } from 'react';
import { askAboutEmiten } from '../api/client';

interface AskPanelProps {
  symbol: string;
}

interface ChatEntry {
  question: string;
  answer: string;
}

const SUGGESTIONS = ['Apa arti Skor Komposit di atas?', 'Kenapa DER-nya segitu?', 'Jelaskan hasil framework investasinya'];

export function AskPanel({ symbol }: AskPanelProps) {
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
    <section className="mt-10">
      <h2 className="text-sm font-medium text-neutral-300">Tanya AI tentang Emiten Ini</h2>
      <p className="mt-1 text-xs text-neutral-500">
        Jawaban dihasilkan AI berdasarkan data yang sudah dihitung di halaman ini saja — bukan rekomendasi investasi.
      </p>

      {history.length === 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => submit(s)}
              disabled={loading}
              className="rounded-full border border-neutral-700 px-3 py-1 text-xs text-neutral-400 hover:border-neutral-500 hover:text-neutral-200 disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 space-y-4">
        {history.map((entry, i) => (
          <div key={i} className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
            <p className="text-sm font-medium text-neutral-200">{entry.question}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-400">{entry.answer}</p>
          </div>
        ))}
      </div>

      {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(question);
        }}
        className="mt-3 flex gap-2"
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Tanya soal skor, rasio, atau framework di atas..."
          disabled={loading}
          className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 disabled:opacity-50"
        >
          {loading ? 'Memuat...' : 'Tanya'}
        </button>
      </form>
    </section>
  );
}
