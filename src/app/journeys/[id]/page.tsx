'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamically import map to avoid SSR issues with Leaflet
const JourneyMap = dynamic(() => import('@/components/Journey/JourneyMap'), { 
    ssr: false,
    loading: () => <p>Caricamento mappa...</p> 
});
import JourneyTimeline from '@/components/Journey/JourneyTimeline';

// Expanded type for a full journey with memories
interface Memory {
    id: string;
    title: string;
    date: string;
    latitude: string | null;
    longitude: string | null;
}
interface JourneyMemory {
    memory: Memory;
    order: number;
}
interface Journey {
  id: string;
  title: string;
  description: string | null;
  memories: JourneyMemory[];
}

export default function JourneyDetailPage() {
  const params = useParams();
  const { id } = params;
  const [journey, setJourney] = useState<Journey | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMemoryId, setSelectedMemoryId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    async function fetchJourney() {
      try {
        const response = await fetch(`/api/journeys/${id}`);
        if (!response.ok) {
          throw new Error('Errore nel caricamento del viaggio');
        }
        const data = await response.json();
        setJourney(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchJourney();
  }, [id]);

  if (isLoading) {
    return <div className="container mx-auto p-4">Caricamento...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500">{error}</div>;
  }

  if (!journey) {
    return <div className="container mx-auto p-4">Viaggio non trovato.</div>;
  }

  const memories = journey.memories.map(jm => jm.memory);

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <div className="w-full md:w-1/3 p-4 overflow-y-auto">
        <h1 className="text-3xl font-bold mb-2">{journey.title}</h1>
        <p className="text-gray-600 mb-6">{journey.description}</p>
        <JourneyTimeline memories={memories} onMemorySelect={setSelectedMemoryId} />
      </div>
      <div className="w-full md:w-2/3 h-64 md:h-full">
        <JourneyMap memories={memories} selectedMemoryId={selectedMemoryId} />
      </div>
    </div>
  );
} 