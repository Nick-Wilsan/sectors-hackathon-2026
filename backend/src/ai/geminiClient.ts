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

// Gemini's free tier caps gemini-2.5-flash at 5 requests/minute — hit in
// practice while running the F-05 safety test (Technical Spec 11, decision
// 2026-09-04). Retry with backoff rather than failing the whole request.
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 8000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimitError(err: unknown): boolean {
  return err instanceof Error && (err.message.includes('RESOURCE_EXHAUSTED') || err.message.includes('429'));
}

/**
 * Explains structured analysis output (never raw Sectors data) in plain Indonesian.
 * `context` must be the output of the analysis layer — see Technical Spec section 2
 * ("Lapisan AI tidak boleh mengambil data langsung dari sumber data").
 */
export async function explainContext(question: string, context: unknown): Promise<string> {
  const ai = getClient();

  for (let attempt = 0; ; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        config: { systemInstruction: SYSTEM_INSTRUCTION },
        contents: [
          {
            role: 'user',
            parts: [{ text: `Konteks (hasil perhitungan sistem):\n${JSON.stringify(context)}\n\nPertanyaan: ${question}` }],
          },
        ],
      });
      return response.text ?? '';
    } catch (err) {
      if (!isRateLimitError(err) || attempt >= MAX_RETRIES) throw err;
      await sleep(RETRY_BASE_DELAY_MS * (attempt + 1));
    }
  }
}
