import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { exchangeCodeForToken } from '@/lib/spotify';
import { prisma } from '@/lib/prisma';
import { t } from '@/lib/localization';
import { encrypt } from '@/lib/crypto';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Verifica che l'utente sia autenticato
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.redirect(
        new URL('/auth/signin?error=unauthorized', request.url)
      );
    }

    // Gestisci errori da Spotify
    if (error) {
      console.error('Errore dall\'autorizzazione Spotify:', error);
      return NextResponse.redirect(
        new URL('/settings?error=spotify_auth_failed', request.url)
      );
    }

    // Verifica che ci sia il codice di autorizzazione
    if (!code) {
      return NextResponse.redirect(
        new URL('/settings?error=spotify_no_code', request.url)
      );
    }

    // Verifica lo state per sicurezza
    if (!state || !state.startsWith(session.user.id)) {
      console.error('State non valido nell\'autorizzazione Spotify');
      return NextResponse.redirect(
        new URL('/settings?error=spotify_invalid_state', request.url)
      );
    }

    // Scambia il codice per un access token
    const tokenData = await exchangeCodeForToken(code);

    // Salva o aggiorna i token nel database
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        spotifyAccessToken: tokenData.access_token ? encrypt(tokenData.access_token) : null,
        spotifyRefreshToken: tokenData.refresh_token ? encrypt(tokenData.refresh_token) : null,
        spotifyTokenExpiry: new Date(Date.now() + tokenData.expires_in * 1000),
      },
    });

    console.log('Token Spotify salvati per l\'utente:', session.user.id);

    // Redirect all'interfaccia con successo
    return NextResponse.redirect(
      new URL('/settings?success=spotify_connected', request.url)
    );

  } catch (error) {
    console.error('Errore nel callback Spotify:', error);
    return NextResponse.redirect(
      new URL('/settings?error=spotify_callback_failed', request.url)
    );
  }
}

export async function POST() {
  return NextResponse.json(
    { error: t('errors.methodNotAllowed') },
    { status: 405 }
  );
} 