import { buildEmitenAiContext } from './context.js';
import { buildMarketAiContext, MARKET_SCOPE_INSTRUCTION } from './marketAiContext.js';
import { buildNewsAiContext, NEWS_SCOPE_INSTRUCTION } from './newsAiContext.js';
import { explainContext } from './geminiClient.js';

// F-05 has three scopes, one per page, because an assistant that answers about
// the wrong subject is worse than no assistant. Each builds its context from
// data the page already computed and adds its own constraints on top of the
// shared compliance rules — none of them may loosen those.

export interface AskResult {
  answer: string;
  context: Awaited<ReturnType<typeof buildEmitenAiContext>>;
}

/** Answers a user's question about one emiten, grounded in F-01/F-03/F-04 output. */
export async function askAboutEmiten(symbol: string, question: string): Promise<AskResult> {
  const context = await buildEmitenAiContext(symbol);
  const answer = await explainContext(question, context);
  return { answer, context };
}

/** Answers about the dashboard: index, movers, most-traded, anomaly scan. */
export async function askAboutMarket(question: string): Promise<string> {
  const context = await buildMarketAiContext();
  return explainContext(question, context, MARKET_SCOPE_INSTRUCTION);
}

/** Answers about one news article and the corpus around it. */
export async function askAboutArticle(articleId: string, question: string): Promise<string> {
  const context = await buildNewsAiContext(articleId);
  return explainContext(question, context, NEWS_SCOPE_INSTRUCTION);
}
