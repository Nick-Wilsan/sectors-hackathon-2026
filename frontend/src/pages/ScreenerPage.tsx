import { MarketOverview } from '../components/MarketOverview';
import { ScreenerPanel } from '../components/ScreenerPanel';
import { FloatingAIChat } from '../components/FloatingAIChat';
import { askAboutMarket } from '../api/client';

// The dashboard route. Composition order is deliberate: MarketOverview renders
// the IHSG hero, then this screener panel, then the rest of the market context.
export function ScreenerPage() {
  return (
    <div>
      <MarketOverview insightSlot={<ScreenerPanel />} />

      {/* Cakupan dasbor. Sebelumnya launcher ini dipatok ke simbol BBCA, jadi
          panelnya berjudul "Tanya AI · BBCA" pada halaman yang sama sekali
          tidak membahas BBCA — dan jawabannya pun tentang emiten yang salah. */}
      <FloatingAIChat
        scopeLabel="Dasbor Pasar"
        scopeNote="Menjelaskan indeks, penggerak, dan pemindaian anomali yang tampil di halaman ini — bukan rekomendasi investasi."
        ask={askAboutMarket}
        suggestions={[
          'Apa yang terjadi di pasar hari ini?',
          'Kenapa ada emiten yang ditandai tidak biasa?',
          'Apa itu Skor Komposit dan bagaimana cara membacanya?',
        ]}
      />
    </div>
  );
}
