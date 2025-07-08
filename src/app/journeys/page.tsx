'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import GenerateJourneyModal from '@/components/Journey/GenerateJourneyModal';

// Simplified Journey type for the list view
interface JourneySummary {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  _count: {
    memories: number;
  };
}

export default function JourneysPage() {
  const [journeys, setJourneys] = useState<JourneySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function fetchJourneys() {
      try {
        const response = await fetch('/api/journeys');
        if (!response.ok) {
          throw new Error('Errore nel caricamento dei viaggi');
        }
        const data = await response.json();
        setJourneys(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchJourneys();
  }, []);
  
  const handleJourneyGenerated = (newJourney: JourneySummary) => {
    setJourneys(prev => [newJourney, ...prev]);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">I Vostri Viaggi</h1>
        <Button onClick={() => setIsModalOpen(true)}>Crea un Nuovo Viaggio</Button>
      </div>

      {isLoading && <p>Caricamento...</p>}
      {error && <p className="text-red-500">{error}</p>}
      
      {!isLoading && !error && (
        journeys.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {journeys.map((journey) => (
                    <Link href={`/journeys/${journey.id}`} key={journey.id} className="block p-6 border rounded-lg shadow-md hover:shadow-lg transition-shadow bg-white dark:bg-gray-800">
                        <h3 className="text-2xl font-bold mb-2">{journey.title}</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4 truncate">{journey.description || 'Nessuna descrizione'}</p>
                        <div className="text-sm text-gray-500 dark:text-gray-300">
                            <p>{new Date(journey.startDate).toLocaleDateString()} - {new Date(journey.endDate).toLocaleDateString()}</p>
                            <p>{journey._count.memories} ricordi</p>
                        </div>
                    </Link>
                ))}
            </div>
        ) : (
            <div className="text-center py-10">
                <p>Non hai ancora creato nessun viaggio.</p>
                <Button onClick={() => setIsModalOpen(true)} className="mt-4">Inizia creando il tuo primo viaggio</Button>
            </div>
        )
      )}

      <GenerateJourneyModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onJourneyGenerated={handleJourneyGenerated}
      />
    </div>
  );
} 