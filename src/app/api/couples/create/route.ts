import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

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
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Devi essere autenticato per creare una coppia' },
        { status: 401 }
      )
    }

    // Verifica che l'utente non sia già in una coppia
    const existingUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { couple: true }
    })

    if (existingUser?.couple) {
      return NextResponse.json(
        { error: 'Sei già parte di una coppia' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = createCoupleSchema.parse(body)

    // Genera un codice di invito unico
    let inviteCode: string
    let codeExists = true
    
    while (codeExists) {
      inviteCode = generateInviteCode()
      const existing = await prisma.couple.findUnique({
        where: { inviteCode }
      })
      codeExists = !!existing
    }

    // Crea la coppia
    const couple = await prisma.couple.create({
      data: {
        name: validatedData.name,
        inviteCode: inviteCode!,
        anniversary: validatedData.anniversary ? new Date(validatedData.anniversary) : null,
      }
    })

    // Associa l'utente alla coppia
    await prisma.user.update({
      where: { id: session.user.id },
      data: { coupleId: couple.id }
    })

    return NextResponse.json({
      success: true,
      couple: {
        id: couple.id,
        name: couple.name,
        inviteCode: couple.inviteCode,
        anniversary: couple.anniversary,
      }
    })

  } catch (error) {
    console.error('Errore nella creazione della coppia:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dati non validi', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
} 