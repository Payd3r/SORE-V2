import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * @swagger
 * /auth/{...nextauth}:
 *   get:
 *     summary: NextAuth.js Authentication
 *     description: |
 *       Handles various authentication flows via NextAuth.js.
 *       This is a catch-all route that manages sign-in, sign-out, callbacks, and other NextAuth.js functionalities.
 *       
 *       Supported providers:
 *       - Google
 *       - Email/Password (Credentials)
 *       
 *       Common endpoints managed by this handler include:
 *       - `/api/auth/signin`: Page to sign in.
 *       - `/api/auth/signout`: Action to sign out.
 *       - `/api/auth/callback/google`: Callback URL for Google OAuth.
 *       - `/api/auth/session`: Get session information.
 *       - `/api/auth/csrf`: Get CSRF token.
 *       - `/api/auth/providers`: Get a list of configured providers.
 *     tags: [Auth]
 *     responses:
 *       '200':
 *         description: Varies depending on the NextAuth.js action (e.g., returns session data, redirects, etc.).
 *       '302':
 *         description: Redirects for sign-in, sign-out, or callback flows.
 *   post:
 *     summary: NextAuth.js Authentication
 *     description: |
 *       Handles various authentication flows via NextAuth.js, particularly for credentials-based sign-in.
 *       This is a catch-all route that manages sign-in, sign-out, callbacks, and other NextAuth.js functionalities.
 *       
 *       Supported providers:
 *       - Google
 *       - Email/Password (Credentials)
 *     tags: [Auth]
 *     requestBody:
 *       description: Required for credentials-based sign-in.
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               csrfToken:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Varies depending on the NextAuth.js action (e.g., returns session data, redirects, etc.).
 *       '302':
 *         description: Redirects for sign-in, sign-out, or callback flows.
 */
const handler = NextAuth(authOptions)

export { handler as GET, handler as POST } 