import { buildEmitenAiContext } from './context.js';
import { explainContext } from './geminiClient.js';

export interface AskResult {
  answer: string;
  context: Awaited<ReturnType<typeof buildEmitenAiContext>>;
}

/** F-05: answers a user's question about one emiten, grounded in F-01/F-03/F-04 output. */
export async function askAboutEmiten(symbol: string, question: string): Promise<AskResult> {
  const context = await buildEmitenAiContext(symbol);
  const answer = await explainContext(question, context);
  return { answer, context };
}
