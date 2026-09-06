import { GoogleGenAI } from '@google/genai';
import { config, requireEnv } from '../config.js';

// Compliance rules (Technical Spec 6 / PRD B-02, B-04):
// - Only explain numbers present in the provided context; never invent figures.
// - Never suggest buy/sell/hold actions.
// - Never state a probability or direction for future price movement.
// - If information is missing from context, say so explicitly.
// - Answer in plain, non-technical Indonesian.
export const SYSTEM_INSTRUCTION = `
Anda adalah asisten yang menjelaskan data pasar saham Indonesia dalam bahasa awam.
Aturan wajib:
1. Hanya jelaskan angka yang tersedia pada konteks yang diberikan. Jangan mengarang angka.
2. Jangan menyarankan tindakan beli, jual, atau menahan posisi dalam bentuk apa pun.
3. Jangan menyatakan probabilitas atau perkiraan arah pergerakan harga.
4. Jika informasi tidak tersedia pada konteks, nyatakan secara eksplisit bahwa informasi tersebut tidak tersedia.
5. Gunakan bahasa yang dapat dipahami pengguna tanpa latar belakang keuangan.
6. Jika konteks menyertakan kamusIstilah, gunakan definisi persis dari sana ketika menjelaskan istilah teknis — jangan memakai pengetahuan umum yang mungkin berbeda dari definisi resmi produk ini.
`.trim();

let client: GoogleGenAI | undefined;

function getClient(): GoogleGenAI {
  if (!client) {
    const apiKey = config.geminiApiKey || requireEnv('GEMINI_API_KEY');
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

// gemini-2.5-flash hit BOTH a 5 req/min cap and, on this newly-created API
// key/project, a 20 req/DAY cap (far below Google's documented 500-1500 RPD
// steady-state free-tier limit — almost certainly a new-key ramp-up quota).
// Switched to flash-lite, which carries its own separate (typically higher)
// free-tier quota. Retry-with-backoff stays for the per-minute case; a
// same-day RPD exhaustion will still fail after MAX_RETRIES since backoff
// can't outlast a daily reset. Technical Spec bagian 11, decision 2026-09-04.
const MODEL = 'gemini-3.5-flash-lite';
const MAX_RETRIES = 4;
const RETRY_BASE_DELAY_MS = 8000;
// The @google/genai SDK call has no built-in timeout — a stalled connection
// hangs the request forever with no error. Race it against this instead.
// 30s (not shorter): observed live that a request can legitimately take
// several minutes during a Gemini 503 "high demand" episode and still
// succeed — too tight a timeout just converts slow success into failure.
const REQUEST_TIMEOUT_MS = 30000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Transient errors worth retrying: rate limits (429), server overload (503), and our own timeout. */
function isRetryableError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return (
    err.message.includes('RESOURCE_EXHAUSTED') ||
    err.message.includes('429') ||
    err.message.includes('UNAVAILABLE') ||
    err.message.includes('503') ||
    err.message.includes('timed out')
  );
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`Gemini request timed out after ${ms}ms`)), ms)),
  ]);
}

/**
 * Explains structured analysis output (never raw Sectors data) in plain Indonesian.
 * `context` must be the output of the analysis layer — see Technical Spec section 2
 * ("Lapisan AI tidak boleh mengambil data langsung dari sumber data").
 */
export async function explainContext(question: string, context: unknown, extraInstruction?: string): Promise<string> {
  const ai = getClient();
  // Scope rules are appended, never substituted: the six base rules apply on
  // every surface, and a scope may only add constraints on top of them.
  const systemInstruction = extraInstruction ? `${SYSTEM_INSTRUCTION}\n\n${extraInstruction}` : SYSTEM_INSTRUCTION;

  for (let attempt = 0; ; attempt++) {
    try {
      const response = await withTimeout(
        ai.models.generateContent({
          model: MODEL,
          config: { systemInstruction },
          contents: [
            {
              role: 'user',
              parts: [{ text: `Konteks (hasil perhitungan sistem):\n${JSON.stringify(context)}\n\nPertanyaan: ${question}` }],
            },
          ],
        }),
        REQUEST_TIMEOUT_MS,
      );
      return response.text ?? '';
    } catch (err) {
      if (!isRetryableError(err) || attempt >= MAX_RETRIES) throw err;
      await sleep(RETRY_BASE_DELAY_MS * (attempt + 1));
    }
  }
}
