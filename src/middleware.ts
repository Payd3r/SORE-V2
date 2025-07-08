import { withAuth, NextAuthMiddlewareOptions } from 'next-auth/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimiter } from './lib/rate-limiter';
import { getToken } from 'next-auth/jwt';

// Funzione per il rate limiting e CSRF
async function handleApiGuards(req: NextRequest) {
    if (req.nextUrl.pathname.startsWith('/api/')) {
        const rateLimitResponse = await rateLimiter(req);
        if (rateLimitResponse.status === 429) {
            return rateLimitResponse;
        }

        // La protezione CSRF può essere gestita qui se necessaria
    }
    return null;
}

const middleware = async (req: NextRequest) => {
    const apiGuardResponse = await handleApiGuards(req);
    if (apiGuardResponse) return apiGuardResponse;

    const token = await getToken({ req });
    const isAuthenticated = !!token;
    
    const isPublicPage = ['/', '/auth/signin', '/auth/register'].includes(req.nextUrl.pathname);
    const isCoupleSetupPage = req.nextUrl.pathname === '/couples/setup';

    if (!isAuthenticated && !isPublicPage && !req.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.redirect(new URL('/auth/signin', req.url));
    }

    if (isAuthenticated) {
        // Se l'utente è autenticato e cerca di visitare pagine pubbliche, reindirizzalo alla timeline
        if (isPublicPage && req.nextUrl.pathname !== '/') {
             return NextResponse.redirect(new URL('/timeline', req.url));
        }

        const hasCouple = !!token.coupleId;

        if (!hasCouple && !isCoupleSetupPage) {
            return NextResponse.redirect(new URL('/couples/setup', req.url));
        }
        
        if(hasCouple && isCoupleSetupPage) {
            return NextResponse.redirect(new URL('/timeline', req.url));
        }
    }

    return NextResponse.next();
};


const callbackOptions: NextAuthMiddlewareOptions = {};

export default withAuth(middleware, callbackOptions);


export const config = {
  matcher: [
    /*
     * Abbina tutti i percorsi di richiesta eccetto quelli per:
     * - API routes (che gestiamo separatamente)
     * - _next/static (file statici)
     * - _next/image (file di ottimizzazione immagine)
     * - favicon.ico (file favicon)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 