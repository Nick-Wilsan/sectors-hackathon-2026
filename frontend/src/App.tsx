import { Link, Outlet } from 'react-router-dom';
import { Disclaimer } from './components/Disclaimer';

export function App() {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800 px-4 py-3">
        <Link to="/" className="text-sm font-semibold tracking-tight text-neutral-100">
          Sectors Market Intelligence
        </Link>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <Disclaimer />
    </div>
  );
}
