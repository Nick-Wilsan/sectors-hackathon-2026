import { Link, Outlet } from 'react-router-dom';
import { Disclaimer } from './components/Disclaimer';
import { SymbolSearch } from './components/SymbolSearch';

export function App() {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-950 text-neutral-100">
      <header className="flex items-center justify-between gap-4 border-b border-neutral-800 px-4 py-2.5 sm:px-6">
        <Link to="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight text-neutral-100">
          <span className="rounded bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-neutral-950">S</span>
          Sectors Market Intelligence
        </Link>
        <SymbolSearch />
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <Disclaimer />
    </div>
  );
}
