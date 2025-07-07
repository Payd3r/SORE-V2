import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema di validazione per unirsi a una coppia
const joinCoupleSchema = z.object({
  inviteCode: z.string().trim().min(1, 'Il codice di invito è obbligatorio'),
})

/**
 * @swagger
 * /couples/join:
 *   post:
 *     summary: Join an existing couple
 *     description: Allows an authenticated user to join a couple using an invite code.
 *     tags: [Couples]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/JoinCoupleInput'
 *     responses:
 *       '200':
 *         description: Successfully joined the couple.
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
 *         description: Invalid input data, user already in a couple, or couple is full.
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
 *       '404':
 *         description: Invite code not found.
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
        { error: 'Devi essere autenticato per unirti a una coppia' },
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
    const validatedData = joinCoupleSchema.parse(body)

    // Trova la coppia con il codice di invito
    const couple = await prisma.couple.findUnique({
      where: { inviteCode: validatedData.inviteCode },
      include: { 
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    if (!couple) {
      return NextResponse.json(
        { error: 'Codice di invito non valido' },
        { status: 404 }
      )
    }

    // Verifica che la coppia non sia già completa (max 2 utenti)
    if (couple.users.length >= 2) {
      return NextResponse.json(
        { error: 'Questa coppia è già completa' },
        { status: 400 }
      )
    }

    // Associa l'utente alla coppia
    await prisma.user.update({
      where: { id: session.user.id },
      data: { coupleId: couple.id }
    })

    // Recupera la coppia aggiornata con i membri
    const updatedCouple = await prisma.couple.findUnique({
      where: { id: couple.id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      couple: {
        id: updatedCouple!.id,
        name: updatedCouple!.name,
        inviteCode: updatedCouple!.inviteCode,
        anniversary: updatedCouple!.anniversary,
        users: updatedCouple!.users,
      }
    })

  } catch (error) {
    console.error('Errore nell\'unirsi alla coppia:', error)
    
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