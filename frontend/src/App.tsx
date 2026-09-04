import { Link, Outlet } from 'react-router-dom';
import { Footer } from './components/Footer';
import { SymbolSearch } from './components/SymbolSearch';
import { Wordmark } from './components/Wordmark';

export function App() {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-950 text-neutral-100">
      <header className="flex items-center justify-between gap-4 border-b border-neutral-800 px-4 py-2.5 sm:px-6">
        <Link to="/">
          <Wordmark />
        </Link>
        <SymbolSearch />
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
