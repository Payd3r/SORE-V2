import { SpotifyApi, AccessToken } from '@spotify/web-api-ts-sdk';

// Configurazione Spotify
const spotifyConfig = {
  clientId: process.env.SPOTIFY_CLIENT_ID!,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
};

// Scopes richiesti per l'app
export const SPOTIFY_SCOPES = [
  'user-read-private',
  'user-read-email', 
  'playlist-read-private',
  'playlist-read-collaborative',
  'playlist-modify-private',
  'playlist-modify-public',
  'user-top-read',
  'user-recently-played',
  'streaming',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
];

// URL per l'autenticazione
export const getSpotifyAuthURL = (state?: string): string => {
  const baseURL = 'https://accounts.spotify.com/authorize';
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/spotify/callback`;
  
  const params = new URLSearchParams({
    client_id: spotifyConfig.clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: SPOTIFY_SCOPES.join(' '),
    ...(state && { state }),
  });

  return `${baseURL}?${params.toString()}`;
};

// Scambia il codice di autorizzazione per un access token
export const exchangeCodeForToken = async (code: string): Promise<AccessToken> => {
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/spotify/callback`;
  
  const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${spotifyConfig.clientId}:${spotifyConfig.clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error('Errore durante lo scambio del codice per il token');
  }

  return tokenResponse.json();
};

// Rinnova un access token usando il refresh token
export const refreshAccessToken = async (refreshToken: string): Promise<AccessToken> => {
  const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${spotifyConfig.clientId}:${spotifyConfig.clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error('Errore durante il rinnovo del token');
  }

  return tokenResponse.json();
};

// Crea un'istanza del client Spotify autenticato
export const createSpotifyClient = (accessToken: string): SpotifyApi => {
  return SpotifyApi.withAccessToken(spotifyConfig.clientId, {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: 3600,
    refresh_token: '', // Gestito separatamente
  });
};

// Crea un client Spotify usando Client Credentials (per operazioni pubbliche)
export const createSpotifyPublicClient = async (): Promise<SpotifyApi> => {
  return SpotifyApi.withClientCredentials(
    spotifyConfig.clientId,
    spotifyConfig.clientSecret
  );
};

// Verifica se un token è valido
export const isTokenValid = (token: AccessToken): boolean => {
  const now = Date.now();
  const tokenExpiry = token.expires_in * 1000; // Converti in millisecondi
  
  // Considera il token valido se non scade nei prossimi 5 minuti
  return (now + 5 * 60 * 1000) < tokenExpiry;
};

// Interfacce per i dati Spotify
export interface SpotifyUser {
  id: string;
  display_name: string;
  email: string;
  external_urls: {
    spotify: string;
  };
  followers: {
    total: number;
  };
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  country: string;
  product: string;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{
    id: string;
    name: string;
    external_urls: {
      spotify: string;
    };
  }>;
  album: {
    id: string;
    name: string;
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
    external_urls: {
      spotify: string;
    };
  };
  duration_ms: number;
  external_urls: {
    spotify: string;
  };
  preview_url: string | null;
  explicit: boolean;
  popularity: number;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  external_urls: {
    spotify: string;
  };
  followers: {
    total: number;
  };
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  owner: {
    id: string;
    display_name: string;
    external_urls: {
      spotify: string;
    };
  };
  public: boolean;
  collaborative: boolean;
  tracks: {
    total: number;
  };
}

// Utility functions
export const formatDuration = (durationMs: number): string => {
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const getArtistNames = (artists: SpotifyTrack['artists']): string => {
  return artists.map(artist => artist.name).join(', ');
};

export const getTrackImageUrl = (track: SpotifyTrack, size: 'small' | 'medium' | 'large' = 'medium'): string => {
  const images = track.album.images;
  if (!images.length) return '';
  
  switch (size) {
    case 'small':
      return images[images.length - 1]?.url || images[0].url;
    case 'large':
      return images[0]?.url || images[images.length - 1].url;
    case 'medium':
    default:
      return images[Math.floor(images.length / 2)]?.url || images[0].url;
  }
}; 