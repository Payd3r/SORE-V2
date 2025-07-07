'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Music, Play, Pause, ExternalLink, X, Volume2 } from 'lucide-react';
import { formatDuration, getArtistNames, getTrackImageUrl } from '@/lib/spotify';
import { t } from '@/lib/localization';
import { SpotifyTrack } from '@/types/memory';

interface SpotifySearchResult {
  tracks: SpotifyTrack[];
  total: number;
  limit: number;
  offset: number;
}

interface SpotifySearchWidgetProps {
  selectedTrack?: SpotifyTrack | null;
  onTrackSelect: (track: SpotifyTrack | null) => void;
  disabled?: boolean;
  className?: string;
}

export default function SpotifySearchWidget({
  selectedTrack,
  onTrackSelect,
  disabled = false,
  className = '',
}: SpotifySearchWidgetProps) {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SpotifySearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);

  // Debounce search
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Verifica la connessione Spotify
  useEffect(() => {
    checkSpotifyConnection();
  }, [session]);

  // Esegui ricerca quando cambia la query debounced
  useEffect(() => {
    if (debouncedQuery.trim() && isConnected) {
      searchTracks(debouncedQuery);
    } else {
      setSearchResults(null);
    }
  }, [debouncedQuery, isConnected]);

  const checkSpotifyConnection = async () => {
    if (!session?.user) return;

    try {
      const response = await fetch('/api/spotify/search?q=test&limit=1');
      setIsConnected(response.status !== 403);
    } catch (error) {
      setIsConnected(false);
    }
  };

  const searchTracks = async (query: string) => {
    if (!query.trim() || !isConnected) return;

    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/spotify/search?q=${encodeURIComponent(query)}&type=track&limit=10`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore durante la ricerca');
      }

      const data = await response.json();
      setSearchResults(data.data);
    } catch (error) {
      console.error('Errore durante la ricerca Spotify:', error);
      setError(error instanceof Error ? error.message : 'Errore durante la ricerca');
    } finally {
      setIsSearching(false);
    }
  };

  const connectToSpotify = async () => {
    try {
      const response = await fetch('/api/auth/spotify');
      const data = await response.json();
      
      if (data.success && data.authUrl) {
        window.open(data.authUrl, '_blank', 'width=600,height=700');
      }
    } catch (error) {
      console.error('Errore durante la connessione a Spotify:', error);
    }
  };

  const playPreview = useCallback((track: SpotifyTrack) => {
    if (!track.preview_url) return;

    // Stop current audio if playing
    if (currentAudio) {
      currentAudio.pause();
      setPlayingTrackId(null);
    }

    if (playingTrackId === track.id) {
      setCurrentAudio(null);
      setPlayingTrackId(null);
      return;
    }

    const audio = new Audio(track.preview_url);
    audio.volume = 0.5;
    
    audio.addEventListener('ended', () => {
      setPlayingTrackId(null);
      setCurrentAudio(null);
    });

    audio.play();
    setCurrentAudio(audio);
    setPlayingTrackId(track.id);
  }, [currentAudio, playingTrackId]);

  const stopPreview = useCallback(() => {
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
      setPlayingTrackId(null);
    }
  }, [currentAudio]);

  const handleTrackSelect = (track: SpotifyTrack) => {
    stopPreview();
    onTrackSelect(track);
    setSearchQuery('');
    setSearchResults(null);
  };

  const clearSelection = () => {
    stopPreview();
    onTrackSelect(null);
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause();
      }
    };
  }, [currentAudio]);

  if (!session?.user) {
    return (
      <Card className={`${className}`}>
        <CardContent className="p-4 text-center">
          <Music className="mx-auto mb-2 h-8 w-8 text-gray-400" />
          <p className="text-sm text-gray-600">
            Accedi per cercare musica su Spotify
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <Card className={`${className}`}>
        <CardContent className="p-4 text-center">
          <Music className="mx-auto mb-2 h-8 w-8 text-gray-400" />
          <p className="text-sm text-gray-600 mb-3">
            Connetti il tuo account Spotify per aggiungere musica alle tue memorie
          </p>
          <Button onClick={connectToSpotify} disabled={disabled}>
            <Volume2 className="mr-2 h-4 w-4" />
            Connetti Spotify
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <Music className="mr-2 h-5 w-5" />
          Musica Spotify
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selected Track Display */}
        {selectedTrack && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center space-x-3">
              {selectedTrack.album.images[0] && (
                <img
                  src={getTrackImageUrl(selectedTrack, 'small')}
                  alt={selectedTrack.album.name}
                  className="w-12 h-12 rounded"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{selectedTrack.name}</p>
                <p className="text-xs text-gray-600 truncate">
                  {getArtistNames(selectedTrack.artists)}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {selectedTrack.album.name}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {selectedTrack.preview_url && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => playPreview(selectedTrack)}
                    disabled={disabled}
                  >
                    {playingTrackId === selectedTrack.id ? (
                      <Pause className="h-3 w-3" />
                    ) : (
                      <Play className="h-3 w-3" />
                    )}
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={clearSelection}
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Cerca una canzone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            disabled={disabled || isSearching}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isSearching && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Ricerca in corso...</p>
          </div>
        )}

        {/* Search Results */}
        {searchResults && searchResults.tracks.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {searchResults.tracks.map((track) => (
              <div
                key={track.id}
                className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
                onClick={() => handleTrackSelect(track)}
              >
                <div className="flex items-center space-x-3">
                  {track.album.images[0] && (
                    <img
                      src={getTrackImageUrl(track, 'small')}
                      alt={track.album.name}
                      className="w-10 h-10 rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{track.name}</p>
                    <p className="text-xs text-gray-600 truncate">
                      {getArtistNames(track.artists)}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {formatDuration(track.duration_ms)}
                      </Badge>
                      {track.explicit && (
                        <Badge variant="outline" className="text-xs">
                          E
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                                         {track.preview_url && (
                       <Button
                         type="button"
                         size="sm"
                         variant="ghost"
                         onClick={(e: React.MouseEvent) => {
                           e.stopPropagation();
                           playPreview(track);
                         }}
                         disabled={disabled}
                       >
                         {playingTrackId === track.id ? (
                           <Pause className="h-3 w-3" />
                         ) : (
                           <Play className="h-3 w-3" />
                         )}
                       </Button>
                     )}
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(track.external_urls.spotify, '_blank');
                      }}
                      disabled={disabled}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {searchResults && searchResults.tracks.length === 0 && searchQuery && (
          <div className="text-center py-4">
            <Music className="mx-auto mb-2 h-8 w-8 text-gray-400" />
            <p className="text-sm text-gray-600">
              Nessuna canzone trovata per "{searchQuery}"
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 