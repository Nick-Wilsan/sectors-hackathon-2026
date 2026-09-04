import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function SymbolSearch() {
  const [value, setValue] = useState('');
  const navigate = useNavigate();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const symbol = value.trim().toUpperCase().replace('.JK', '');
    if (symbol) {
      navigate(`/emiten/${symbol}`);
      setValue('');
    }
  }

  return (
    <form onSubmit={submit} className="w-40 sm:w-56">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Cari simbol (mis. BBCA)"
        className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-100 placeholder:text-neutral-600 focus:border-brand focus:outline-none"
      />
    </form>
  );
}
