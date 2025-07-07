import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

/**
 * @swagger
 * /couples/me:
 *   get:
 *     summary: Get the current user's couple information
 *     description: Retrieves the couple information for the authenticated user, including the other member of the couple.
 *     tags: [Couples]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Successfully retrieved couple information.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hasCouple:
 *                   type: boolean
 *                 couple:
 *                   $ref: '#/components/schemas/Couple'
 *       '401':
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '404':
 *         description: User not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '500':
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Devi essere autenticato' },
        { status: 401 }
      )
    }

    // Trova l'utente con la sua coppia
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        couple: {
          include: {
            users: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              }
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Utente non trovato' },
        { status: 404 }
      )
    }

    // Se l'utente non è in una coppia
    if (!user.couple) {
      return NextResponse.json({
        hasCouple: false,
        couple: null,
      })
    }

    // Restituisce le informazioni della coppia
    return NextResponse.json({
      hasCouple: true,
      couple: {
        id: user.couple.id,
        name: user.couple.name,
        inviteCode: user.couple.inviteCode,
        anniversary: user.couple.anniversary,
        users: user.couple.users,
        isComplete: user.couple.users.length >= 2,
      }
    })

  } catch (error) {
    console.error('Errore nel recupero della coppia:', error)
    
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}

const coupleUpdateSchema = z.object({
  name: z.string().min(1, "Il nome non può essere vuoto").max(255),
});

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session.user.coupleId) {
    return new NextResponse('Unauthorized or not in a couple', { status: 401 });
  }

  try {
    const json = await req.json();
    const body = coupleUpdateSchema.parse(json);

    const updatedCouple = await prisma.couple.update({
      where: { id: session.user.coupleId },
      data: {
        name: body.name,
      },
    });

    return NextResponse.json(updatedCouple);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 });
    }
    console.error('[COUPLE_ME_PATCH]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 