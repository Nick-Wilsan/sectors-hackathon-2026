import { useEffect, useRef, useState } from 'react';
import { StocketAiMark } from './StocketAiMark';

interface FloatingAIChatProps {
  /** Subjek yang sedang dibahas, tampil setelah judul — kode emiten, "Dasbor
   *  Pasar", "Berita Ini". Dikosongkan bila halaman tidak punya subjek tunggal;
   *  panel lalu hanya berjudul "Tanya AI". */
  scopeLabel?: string;
  /** Satu kalimat yang menyatakan batas cakupan, tampil di bawah judul. */
  scopeNote: string;
  /** Starter questions, tailored to the page the launcher sits on. */
  suggestions: string[];
  /** Pemanggil endpoint yang sesuai cakupan halaman. Komponen ini sengaja
   *  tidak tahu endpoint mana yang dipakai — sebelumnya ia terpaku pada satu
   *  emiten, sehingga dasbor memakainya dengan simbol BBCA yang dipatok mati
   *  dan mengumumkan subjek yang bukan isi halamannya. */
  ask: (question: string) => Promise<string>;
  /** Dinaikkan pemanggil untuk membuka panel dari tempat lain di halaman.
   *  Uji pengguna 7 September 2026: tidak seorang pun dari dua responden
   *  menyadari peluncur ini ada, jadi ajakan kontekstual di dalam isi halaman
   *  perlu bisa membukanya. */
  openSignal?: number;
}

interface ChatEntry {
  question: string;
  answer: string;
}

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
export function FloatingAIChat({ scopeLabel, scopeNote, suggestions, ask, openSignal = 0 }: FloatingAIChatProps) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [history, setHistory] = useState<ChatEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const peluncurRef = useRef<HTMLButtonElement>(null);

  // Keep the newest answer in view; long Gemini replies otherwise land below
  // the fold of the panel and look like nothing happened.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history, loading]);

  // Nilai awal 0 tidak boleh ikut membuka panel saat halaman baru dimuat,
  // jadi yang dipantau kenaikannya, bukan nilainya.
  useEffect(() => {
    if (openSignal > 0) setOpen(true);
  }, [openSignal]);

  // Menekan di luar panel menutupnya, sama seperti dialog dan menu pada
  // umumnya. Tanpa ini panel bertahan sampai tombol silangnya ditemukan, dan
  // karena ia menutupi isi halaman, pembaca yang ingin kembali membaca justru
  // terhalang oleh alat bantu yang tadi dibukanya.
  //
  // 'mousedown', bukan 'click': memakai click membuat penekanan yang DIMULAI
  // di dalam panel lalu berakhir di luarnya — misalnya saat menyeret untuk
  // menyorot teks jawaban — ikut menutup panel.
  //
  // Peluncurnya sengaja ikut dianggap "dalam", sebab ia sudah punya perilaku
  // sendiri: menutupnya lewat jalur ini akan membuat penekanan berikutnya
  // membuka lagi panel yang baru saja tertutup.
  useEffect(() => {
    if (!open) return;
    const diLuar = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (panelRef.current?.contains(target)) return;
      if (peluncurRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', diLuar);
    return () => document.removeEventListener('mousedown', diLuar);
  }, [open]);

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
      const answer = await ask(q);
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
        ref={peluncurRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Tutup asisten AI' : scopeLabel ? `Tanya AI tentang ${scopeLabel}` : 'Tanya AI'}
        aria-expanded={open}
        // Dulu sebuah lingkaran 48 piksel berisi lambang tanpa teks. Uji
        // pengguna 7 September 2026: kedua responden menggulir seluruh halaman
        // tanpa sekali pun menyadari ada asisten di sini — lambang sendirian
        // tidak menyatakan apa pun tentang fungsinya. Sekarang peluncurnya
        // berlabel, dan menyusut jadi lingkaran hanya saat panel terbuka,
        // ketika fungsinya sudah jelas dan lebarnya justru mengganggu.
        className={
          open
            ? 'fixed bottom-20 right-space-16 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-primary-container bg-primary-container text-background-base shadow-[var(--shadow-popover)] transition-colors hover:bg-accent-hover active:scale-[0.96]'
            : 'fixed bottom-20 right-space-16 z-50 flex h-12 items-center gap-space-8 rounded-full border border-primary-container bg-primary-container pl-space-12 pr-space-16 font-body-md text-body-md font-bold text-background-base shadow-[var(--shadow-popover)] transition-colors hover:bg-accent-hover active:scale-[0.96]'
        }
      >
        {open ? (
          <span className="material-symbols-outlined text-[22px]">close</span>
        ) : (
          <>
            {/* Cakupannya tidak diulang di sini. Peluncur ini melayang di atas
                isi halaman, jadi setiap huruf tambahan menutupi lebih banyak
                teks di baliknya — dan subjeknya sudah disebut pada judul panel
                begitu dibuka, serta pada ajakan di dalam blok jawaban. */}
            <StocketAiMark />
            <span className="whitespace-nowrap">Tanya AI</span>
          </>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label={scopeLabel ? `Tanya AI tentang ${scopeLabel}` : 'Tanya AI'}
          className="fixed bottom-36 right-space-16 z-50 flex max-h-[min(520px,calc(100vh-14rem))] w-[min(92vw,384px)] flex-col overflow-hidden rounded-xl border border-surface-variant bg-surface-card shadow-[var(--shadow-popover)]"
        >
          <div className="flex items-start gap-space-8 border-b border-border-subtle px-space-12 py-space-8">
            <span className="mt-space-2 shrink-0 text-primary">
              <StocketAiMark size={18} />
            </span>
            <div>
              <h2 className="font-headline-sm text-headline-sm font-bold text-text-primary">
                Tanya AI
                {scopeLabel && (
                  <>
                    {' '}
                    &middot; <span className="text-primary">{scopeLabel}</span>
                  </>
                )}
              </h2>
              <p className="font-body-sm text-body-sm text-text-muted">{scopeNote}</p>
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
