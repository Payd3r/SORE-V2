import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for challenge update
const updateChallengeSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(100, 'Title too long').optional(),
  description: z.string().trim().optional(),
  category: z.string().trim().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  status: z.enum(['active', 'completed', 'paused']).optional(),
  progress: z.number().min(0).max(100).optional(),
  reward: z.string().trim().optional(),
  endDate: z.string().datetime().optional(),
});

// GET /api/challenges/[id] - Get a specific challenge
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { couple: true },
    });

    if (!user?.couple) {
      return NextResponse.json({ error: 'User not part of a couple' }, { status: 400 });
    }

    const challenge = await prisma.challenge.findFirst({
      where: {
        id,
        coupleId: user.couple.id,
      },
      include: {
        couple: true,
      },
    });

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    return NextResponse.json(challenge);
  } catch (error) {
    console.error('Error fetching challenge:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/challenges/[id] - Update a challenge
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { couple: true },
    });

    if (!user?.couple) {
      return NextResponse.json({ error: 'User not part of a couple' }, { status: 400 });
    }

    // Check if challenge exists and belongs to the couple
    const existingChallenge = await prisma.challenge.findFirst({
      where: {
        id,
        coupleId: user.couple.id,
      },
    });

    if (!existingChallenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = updateChallengeSchema.parse(body);

    // Handle completion logic
    const updateData: any = {
      ...validatedData,
      updatedAt: new Date(),
    };

    if (validatedData.endDate) {
      updateData.endDate = new Date(validatedData.endDate);
    }

    // If status is being set to completed, set completedAt
    if (validatedData.status === 'completed' && existingChallenge.status !== 'completed') {
      updateData.completedAt = new Date();
      updateData.progress = 100;
    }

    // If progress is set to 100, mark as completed
    if (validatedData.progress === 100 && existingChallenge.status !== 'completed') {
      updateData.status = 'completed';
      updateData.completedAt = new Date();
    }

    const challenge = await prisma.challenge.update({
      where: { id },
      data: updateData,
      include: {
        couple: true,
      },
    });

    return NextResponse.json(challenge);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    
    console.error('Error updating challenge:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/challenges/[id] - Delete a challenge
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { couple: true },
    });

    if (!user?.couple) {
      return NextResponse.json({ error: 'User not part of a couple' }, { status: 400 });
    }

    // Check if challenge exists and belongs to the couple
    const existingChallenge = await prisma.challenge.findFirst({
      where: {
        id,
        coupleId: user.couple.id,
      },
    });

    if (!existingChallenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    await prisma.challenge.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Challenge deleted successfully' });
  } catch (error) {
    console.error('Error deleting challenge:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 