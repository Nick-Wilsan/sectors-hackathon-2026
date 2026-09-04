import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadCompanyIndex, searchCompanyIndex } from '../api/companyIndex';
import type { CompanyLite } from '../api/types';

interface SymbolSearchProps {
  /** Larger hero variant for the dashboard vs the compact nav-bar variant. */
  size?: 'sm' | 'lg';
}

export function SymbolSearch({ size = 'sm' }: SymbolSearchProps) {
  const [companies, setCompanies] = useState<CompanyLite[]>([]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadCompanyIndex().then(setCompanies);
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const results = searchCompanyIndex(companies, query);

  function goTo(company: CompanyLite) {
    navigate(`/emiten/${company.symbol.replace('.JK', '')}`);
    setQuery('');
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      goTo(results[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  const isLg = size === 'lg';

  return (
    <div ref={containerRef} className={`relative ${isLg ? 'w-full max-w-xl' : 'w-40 sm:w-56'}`}>
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActiveIndex(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={isLg ? 'Cari saham, mis. BBCA atau Bank Central Asia...' : 'Cari simbol (mis. BBCA)'}
        className={`w-full rounded-md border border-neutral-700 bg-neutral-900 text-neutral-100 placeholder:text-neutral-600 focus:border-brand focus:outline-none ${
          isLg ? 'px-4 py-3 text-sm' : 'px-3 py-1.5 text-xs'
        }`}
      />

      {open && results.length > 0 && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-neutral-700 bg-neutral-900 shadow-xl">
          {results.map((c, i) => (
            <button
              key={c.symbol}
              onMouseDown={(e) => {
                e.preventDefault();
                goTo(c);
              }}
              onMouseEnter={() => setActiveIndex(i)}
              className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm ${
                i === activeIndex ? 'bg-neutral-800' : ''
              }`}
            >
              <span className="w-16 shrink-0 font-mono text-xs font-semibold text-brand-light">
                {c.symbol.replace('.JK', '')}
              </span>
              <span className="flex-1 truncate text-xs text-neutral-400">{c.companyName}</span>
              <span className="shrink-0 rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] uppercase text-neutral-500">
                Stock &middot; IDX
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
