import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSpotifyClient, refreshAccessToken, isTokenValid } from '@/lib/spotify';
import { prisma } from '@/lib/prisma';
import { t } from '@/lib/localization';
import { encrypt, decrypt } from '@/lib/crypto';

export async function GET(request: NextRequest) {
  try {
    // Verifica che l'utente sia autenticato
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: t('errors.unauthorized') },
        { status: 401 }
      );
    }

    // Recupera i parametri di ricerca
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limitParam = parseInt(searchParams.get('limit') || '20');
    const offsetParam = parseInt(searchParams.get('offset') || '0');
    const type = searchParams.get('type') || 'track'; // track, album, artist, playlist
    
    // Limita i valori per rispettare i vincoli dell'API Spotify
    const limit = Math.min(Math.max(limitParam, 1), 50) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40 | 41 | 42 | 43 | 44 | 45 | 46 | 47 | 48 | 49 | 50;
    const offset = Math.max(offsetParam, 0);

    if (!query) {
      return NextResponse.json(
        { error: 'Parametro di ricerca "q" richiesto' },
        { status: 400 }
      );
    }

    // Recupera i token Spotify dell'utente
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        spotifyAccessToken: true, 
        spotifyRefreshToken: true, 
        spotifyTokenExpiry: true 
      },
    });

    if (!user?.spotifyAccessToken || !user?.spotifyRefreshToken) {
      return NextResponse.json(
        { error: 'Utente non connesso a Spotify. Collega il tuo account Spotify prima.' },
        { status: 403 }
      );
    }

    let accessToken = decrypt(user.spotifyAccessToken);
    const refreshToken = decrypt(user.spotifyRefreshToken);

    // Verifica se il token è scaduto e lo rinnova se necessario
    if (user.spotifyTokenExpiry && new Date() >= user.spotifyTokenExpiry) {
      try {
        const newTokenData = await refreshAccessToken(refreshToken);
        
        // Aggiorna i token nel database
        await prisma.user.update({
          where: { id: session.user.id },
          data: {
            spotifyAccessToken: encrypt(newTokenData.access_token),
            spotifyTokenExpiry: new Date(Date.now() + newTokenData.expires_in * 1000),
            // Aggiorna il refresh token solo se ne viene fornito uno nuovo
            ...(newTokenData.refresh_token && { 
              spotifyRefreshToken: encrypt(newTokenData.refresh_token) 
            }),
          },
        });

        accessToken = newTokenData.access_token;
        console.log('Token Spotify rinnovato per utente:', session.user.id);
      } catch (error) {
        console.error('Errore durante il rinnovo del token Spotify:', error);
        return NextResponse.json(
          { error: t('errors.spotifyTokenExchange') },
          { status: 401 }
        );
      }
    }

    // Crea il client Spotify
    const spotify = createSpotifyClient(accessToken);

    // Esegui la ricerca
    const searchResults = await spotify.search(query, [type as any], 'IT', limit, offset);

    // Formatta i risultati in base al tipo
    let formattedResults;
    switch (type) {
      case 'track':
        formattedResults = {
          tracks: searchResults.tracks.items.map((track: any) => ({
            id: track.id,
            name: track.name,
            artists: track.artists.map((artist: any) => ({
              id: artist.id,
              name: artist.name,
              external_urls: artist.external_urls,
            })),
            album: {
              id: track.album.id,
              name: track.album.name,
              images: track.album.images,
              external_urls: track.album.external_urls,
            },
            duration_ms: track.duration_ms,
            external_urls: track.external_urls,
            preview_url: track.preview_url,
            explicit: track.explicit,
            popularity: track.popularity,
          })),
          total: searchResults.tracks.total,
          limit: searchResults.tracks.limit,
          offset: searchResults.tracks.offset,
        };
        break;
      case 'artist':
        formattedResults = {
          artists: searchResults.artists.items.map((artist: any) => ({
            id: artist.id,
            name: artist.name,
            images: artist.images,
            followers: artist.followers,
            genres: artist.genres,
            popularity: artist.popularity,
            external_urls: artist.external_urls,
          })),
          total: searchResults.artists.total,
          limit: searchResults.artists.limit,
          offset: searchResults.artists.offset,
        };
        break;
      case 'album':
        formattedResults = {
          albums: searchResults.albums.items.map(album => ({
            id: album.id,
            name: album.name,
            artists: album.artists.map(artist => ({
              id: artist.id,
              name: artist.name,
              external_urls: artist.external_urls,
            })),
            images: album.images,
            release_date: album.release_date,
            total_tracks: album.total_tracks,
            external_urls: album.external_urls,
          })),
          total: searchResults.albums.total,
          limit: searchResults.albums.limit,
          offset: searchResults.albums.offset,
        };
        break;
      case 'playlist':
        formattedResults = {
          playlists: searchResults.playlists.items.map(playlist => ({
            id: playlist.id,
            name: playlist.name,
            description: playlist.description,
            images: playlist.images,
            owner: {
              id: playlist.owner.id,
              display_name: playlist.owner.display_name,
              external_urls: playlist.owner.external_urls,
            },
            public: playlist.public,
            collaborative: playlist.collaborative,
            tracks: {
              total: playlist.tracks.total,
            },
            external_urls: playlist.external_urls,
          })),
          total: searchResults.playlists.total,
          limit: searchResults.playlists.limit,
          offset: searchResults.playlists.offset,
        };
        break;
      default:
        formattedResults = searchResults;
    }

    return NextResponse.json({
      success: true,
      data: formattedResults,
      query,
      type,
    });

  } catch (error) {
    console.error('Errore durante la ricerca Spotify:', error);
    return NextResponse.json(
      { 
        error: t('errors.spotifyConnectionFailed'),
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    { error: t('errors.methodNotAllowed') },
    { status: 405 }
  );
} 