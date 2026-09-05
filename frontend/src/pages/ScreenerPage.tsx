import { MarketOverview } from '../components/MarketOverview';
import { ScreenerPanel } from '../components/ScreenerPanel';
import { FloatingAIChat } from '../components/FloatingAIChat';

// The dashboard route. Composition order is deliberate: MarketOverview renders
// the IHSG hero, then this screener panel, then the rest of the market context.
export function ScreenerPage() {
  return (
    <div>
      <MarketOverview insightSlot={<ScreenerPanel />} />

      <FloatingAIChat
        symbol="BBCA"
        suggestions={[
          'Apa itu Skor Komposit dan bagaimana cara membacanya?',
          'Apa arti persentil ROE dan DER di tabel screener?',
          'Kenapa skor emiten ini berbeda dari harganya?',
        ]}
      />
    </div>
  );
}
