import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema di validazione per unirsi a una coppia
const joinCoupleSchema = z.object({
  inviteCode: z.string().min(1, 'Il codice di invito è richiesto'),
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
    const validatedData = joinCoupleSchema.parse(body)

    const coupleToJoin = await prisma.couple.findUnique({
      where: { inviteCode: validatedData.inviteCode },
      include: { users: true }
    })

    if (!coupleToJoin) {
      return new NextResponse('Invalid invite code', { status: 404 })
    }

    if (coupleToJoin.users.length >= 2) {
        return new NextResponse('This couple is already full', { status: 400 })
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { coupleId: coupleToJoin.id },
    })
    
    const updatedCouple = await prisma.couple.findUnique({
        where: { id: coupleToJoin.id },
        include: { users: true }
    })

    return NextResponse.json({ couple: updatedCouple })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 })
    }
    console.error('Error joining couple:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 