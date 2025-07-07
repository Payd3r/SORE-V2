import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSpotifyClient, refreshAccessToken } from '@/lib/spotify';
import { prisma } from '@/lib/prisma';
import { t } from '@/lib/localization';
import { z } from 'zod';
import { encrypt, decrypt } from '@/lib/crypto';

// Helper function to get user and handle token refresh
async function getUserAndSpotifyClient(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      spotifyAccessToken: true, 
      spotifyRefreshToken: true, 
      spotifyTokenExpiry: true 
    },
  });

  if (!user?.spotifyAccessToken || !user?.spotifyRefreshToken) {
    throw new Error('Utente non connesso a Spotify.');
  }

  let accessToken = decrypt(user.spotifyAccessToken);
  const refreshToken = decrypt(user.spotifyRefreshToken);

  if (user.spotifyTokenExpiry && new Date() >= user.spotifyTokenExpiry) {
    const newTokenData = await refreshAccessToken(refreshToken);
    await prisma.user.update({
      where: { id: userId },
      data: {
        spotifyAccessToken: encrypt(newTokenData.access_token),
        spotifyTokenExpiry: new Date(Date.now() + newTokenData.expires_in * 1000),
        ...(newTokenData.refresh_token && { 
          spotifyRefreshToken: encrypt(newTokenData.refresh_token) 
        }),
      },
    });
    accessToken = newTokenData.access_token;
  }

  return createSpotifyClient(accessToken);
}

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: t('errors.unauthorized') }, { status: 401 });
    }

    const { id: playlistId } = params;
    const spotify = await getUserAndSpotifyClient(session.user.id);
    const tracks = await spotify.getPlaylistTracks(playlistId);

    return NextResponse.json({
      success: true,
      tracks: tracks.items.map(item => ({
        added_at: item.added_at,
        track: {
          id: item.track.id,
          name: item.track.name,
          artists: item.track.artists.map((a: any) => a.name),
          album: item.track.album.name,
          duration_ms: item.track.duration_ms,
          preview_url: item.track.preview_url,
          album_art: item.track.album.images?.[0]?.url,
        }
      })),
    });
  } catch (error) {
    console.error(`Errore nel recuperare le tracce dalla playlist:`, error);
    return NextResponse.json({ error: (error as Error).message || t('errors.spotifyConnectionFailed') }, { status: 500 });
  }
}

const addTracksSchema = z.object({
  uris: z.array(z.string().startsWith('spotify:track:')).min(1),
});

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: t('errors.unauthorized') }, { status: 401 });
    }

    const body = await request.json();
    const validation = addTracksSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Payload non valido', details: validation.error.format() }, { status: 400 });
    }

    const { id: playlistId } = params;
    const { uris } = validation.data;
    
    const spotify = await getUserAndSpotifyClient(session.user.id);
    const result = await spotify.addTracksToPlaylist(playlistId, uris);

    return NextResponse.json({ success: true, snapshot_id: result.snapshot_id }, { status: 201 });
  } catch (error) {
    console.error(`Errore nell'aggiungere tracce alla playlist:`, error);
    return NextResponse.json({ error: (error as Error).message || t('errors.spotifyConnectionFailed') }, { status: 500 });
  }
}

const removeTracksSchema = z.object({
  uris: z.array(z.string().startsWith('spotify:track:')).min(1),
});

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: t('errors.unauthorized') }, { status: 401 });
    }

    const body = await request.json();
    const validation = removeTracksSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Payload non valido', details: validation.error.format() }, { status: 400 });
    }

    const { id: playlistId } = params;
    const { uris } = validation.data;
    
    const spotify = await getUserAndSpotifyClient(session.user.id);
    const result = await spotify.removeTracksFromPlaylist(playlistId, uris.map(uri => ({ uri })));

    return NextResponse.json({ success: true, snapshot_id: result.snapshot_id });
  } catch (error) {
    console.error(`Errore nel rimuovere tracce dalla playlist:`, error);
    return NextResponse.json({ error: (error as Error).message || t('errors.spotifyConnectionFailed') }, { status: 500 });
  }
} 