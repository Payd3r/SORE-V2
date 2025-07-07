import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSpotifyAuthURL } from '@/lib/spotify';
import { t } from '@/lib/localization';

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

    // Genera uno state per sicurezza (include l'ID utente)
    const state = `${session.user.id}-${Date.now()}`;
    
    // Genera l'URL di autorizzazione Spotify
    const authUrl = getSpotifyAuthURL(state);

    // Restituisci l'URL per il redirect
    return NextResponse.json({
      success: true,
      authUrl,
      message: t('success.spotifyAuthInitiated'),
    });

  } catch (error) {
    console.error('Errore durante l\'avvio dell\'autenticazione Spotify:', error);
    return NextResponse.json(
      { 
        error: t('errors.spotifyAuthFailed'),
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