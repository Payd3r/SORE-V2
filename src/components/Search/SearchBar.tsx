'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Search as SearchIcon, Heart, BrainCircuit, Camera } from 'lucide-react';
import useSWR from 'swr';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const typeIcons: { [key: string]: React.ElementType } = {
  memory: Heart,
  idea: BrainCircuit,
  image: Camera,
};

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const { data: results, error } = useSWR(
    debouncedQuery ? `/api/search?q=${debouncedQuery}` : null,
    fetcher
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300); // 300ms di debounce

    return () => {
      clearTimeout(handler);
    };
  }, [query]);

  return (
    <div className="relative flex-1 max-w-md">
      <Input
        type="search"
        placeholder="Cerca ricordi, idee, foto..."
        className="pl-10"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <SearchIcon className="w-5 h-5 text-muted-foreground" />
      </div>
      {debouncedQuery && (
        <div className="absolute top-full mt-2 w-full rounded-md border bg-background shadow-lg z-50">
          {error && <div className="p-4 text-destructive">Errore nel caricamento dei risultati.</div>}
          {!results && !error && <div className="p-4 text-muted-foreground">Caricamento...</div>}
          {results && results.length === 0 && <div className="p-4 text-muted-foreground">Nessun risultato trovato.</div>}
          {results && results.length > 0 && (
            <ul className="py-2">
              {results.map((result: any) => {
                const Icon = typeIcons[result.type] || SearchIcon;
                return (
                  <li key={result.id}>
                    <Link
                      href={result.url}
                      className="flex items-center gap-4 px-4 py-2 hover:bg-muted"
                    >
                      <Icon className="w-5 h-5 text-muted-foreground" />
                      <p className="font-semibold">{result.title}</p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
} 