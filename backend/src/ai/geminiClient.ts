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
`.trim();

let client: GoogleGenAI | undefined;

function getClient(): GoogleGenAI {
  if (!client) {
    const apiKey = config.geminiApiKey || requireEnv('GEMINI_API_KEY');
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

/**
 * Explains structured analysis output (never raw Sectors data) in plain Indonesian.
 * `context` must be the output of the analysis layer — see Technical Spec section 2
 * ("Lapisan AI tidak boleh mengambil data langsung dari sumber data").
 */
export async function explainContext(question: string, context: unknown): Promise<string> {
  const ai = getClient();
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
}
