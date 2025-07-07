import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSpotifyClient, refreshAccessToken } from '@/lib/spotify';
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

    // Recupera i parametri
    const { searchParams } = new URL(request.url);
    const limitParam = parseInt(searchParams.get('limit') || '20');
    const offsetParam = parseInt(searchParams.get('offset') || '0');
    
    const limit = Math.min(Math.max(limitParam, 1), 50) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40 | 41 | 42 | 43 | 44 | 45 | 46 | 47 | 48 | 49 | 50;
    const offset = Math.max(offsetParam, 0);

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
            ...(newTokenData.refresh_token && { 
              spotifyRefreshToken: encrypt(newTokenData.refresh_token) 
            }),
          },
        });

        accessToken = newTokenData.access_token;
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

    // Ottieni le playlist dell'utente
    const playlists = await spotify.currentUser.playlists.playlists(limit, offset);

    // Formatta i risultati
    const formattedPlaylists = {
      playlists: playlists.items.map((playlist: any) => ({
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
      total: playlists.total,
      limit: playlists.limit,
      offset: playlists.offset,
    };

    return NextResponse.json({
      success: true,
      data: formattedPlaylists,
    });

  } catch (error) {
    console.error('Errore durante il recupero delle playlist Spotify:', error);
    return NextResponse.json(
      { 
        error: t('errors.spotifyConnectionFailed'),
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verifica che l'utente sia autenticato
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: t('errors.unauthorized') },
        { status: 401 }
      );
    }

    // Recupera i dati della playlist dal body
    const body = await request.json();
    const { name, description, public: isPublic = false, collaborative = false } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Nome della playlist richiesto' },
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
            ...(newTokenData.refresh_token && { 
              spotifyRefreshToken: encrypt(newTokenData.refresh_token) 
            }),
          },
        });

        accessToken = newTokenData.access_token;
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

    // Ottieni l'ID dell'utente Spotify
    const profile = await spotify.currentUser.profile();

    // Crea la playlist
    const playlist = await spotify.playlists.createPlaylist(
      profile.id,
      {
        name,
        description: description || '',
        public: isPublic,
        collaborative,
      }
    );

    // Formatta la risposta
    const formattedPlaylist = {
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
    };

    return NextResponse.json({
      success: true,
      data: formattedPlaylist,
      message: 'Playlist creata con successo',
    });

  } catch (error) {
    console.error('Errore durante la creazione della playlist Spotify:', error);
    return NextResponse.json(
      { 
        error: t('errors.spotifyConnectionFailed'),
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      },
      { status: 500 }
    );
  }
} 