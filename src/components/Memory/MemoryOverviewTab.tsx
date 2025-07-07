'use client';

import React from 'react';
import { Memory } from '@/types/memory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Music, Thermometer, Cloud } from 'lucide-react';
import { getArtistNames } from '@/lib/spotify';

interface MemoryOverviewTabProps {
  memory: Memory;
}

export const MemoryOverviewTab: React.FC<MemoryOverviewTabProps> = ({ memory }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader><CardTitle>Descrizione</CardTitle></CardHeader>
          <CardContent><p>{memory.description || 'Nessuna descrizione fornita.'}</p></CardContent>
        </Card>
      </div>
      <div className="space-y-4">
        {memory.spotifyTrack && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Musica</CardTitle>
              <Music className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{memory.spotifyTrack.name}</div>
              <p className="text-xs text-muted-foreground">{getArtistNames(memory.spotifyTrack.artists)}</p>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Meteo</CardTitle>
            <Cloud className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {memory.weather ? (
              <>
                <div className="text-lg font-bold flex items-center">
                  <Thermometer className="mr-2 h-5 w-5" />
                  {memory.weather.temperature}°C
                </div>
                <p className="text-xs text-muted-foreground">{memory.weather.condition}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Dati meteo non disponibili.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 