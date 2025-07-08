import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { nanoid } from 'nanoid'

// Schema di validazione per la creazione della coppia
const createCoupleSchema = z.object({
  name: z.string().trim().min(1, 'Il nome della coppia è obbligatorio'),
  anniversary: z.string().optional(),
})

// Funzione per generare un codice di invito unico
function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

/**
 * @swagger
 * /couples/create:
 *   post:
 *     summary: Create a new couple
 *     description: Creates a new couple and associates the authenticated user with it.
 *     tags: [Couples]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCoupleInput'
 *     responses:
 *       '200':
 *         description: Couple created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 couple:
 *                   $ref: '#/components/schemas/Couple'
 *       '400':
 *         description: Invalid input data or user is already in a couple.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '401':
 *         description: Unauthorized.
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
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  if (session.user.coupleId) {
    return new NextResponse('User is already in a couple', { status: 400 })
  }

  try {
    const body = await req.json()
    const { name, anniversary } = body

    if (!name) {
      return new NextResponse('Couple name is required', { status: 400 })
    }

    // Genera un codice di invito unico
    let inviteCode: string;
    let codeExists = true;
    
    while (codeExists) {
      inviteCode = nanoid(8).toUpperCase();
      const existing = await prisma.couple.findUnique({
        where: { inviteCode }
      });
      codeExists = !!existing;
    }

    const newCouple = await prisma.couple.create({
      data: {
        name,
        inviteCode: inviteCode!,
        anniversary: anniversary ? new Date(anniversary) : null,
        users: {
          connect: { id: session.user.id }
        }
      }
    })

    return NextResponse.json({ couple: newCouple })

  } catch (error) {
    console.error("Error creating couple:", error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 