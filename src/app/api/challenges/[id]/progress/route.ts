import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for progress update
const updateProgressSchema = z.object({
  progress: z.number().min(0).max(100, 'Progress must be between 0 and 100'),
  note: z.string().trim().optional(),
});

// PUT /api/challenges/[id]/progress - Update challenge progress
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

    if (existingChallenge.status === 'completed') {
      return NextResponse.json({ error: 'Cannot update progress of completed challenge' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = updateProgressSchema.parse(body);

    // Prepare update data
    const updateData: any = {
      progress: validatedData.progress,
      updatedAt: new Date(),
    };

    // If progress reaches 100%, mark as completed
    if (validatedData.progress === 100) {
      updateData.status = 'completed';
      updateData.completedAt = new Date();
    }

    // Update the challenge
    const challenge = await prisma.challenge.update({
      where: { id },
      data: updateData,
      include: {
        couple: true,
      },
    });

    // Create a progress log entry (if we had a ProgressLog model)
    // For now, we'll just return the updated challenge

    return NextResponse.json({
      challenge,
      message: validatedData.progress === 100 
        ? 'Challenge completed! 🎉' 
        : `Progress updated to ${validatedData.progress}%`,
      progressIncrease: validatedData.progress - existingChallenge.progress,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    
    console.error('Error updating challenge progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/challenges/[id]/progress - Get challenge progress history
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
      select: {
        id: true,
        title: true,
        progress: true,
        status: true,
        difficulty: true,
        startDate: true,
        endDate: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    // Calculate progress metrics
    const now = new Date();
    const startDate = new Date(challenge.startDate);
    const endDate = challenge.endDate ? new Date(challenge.endDate) : null;
    
    const daysElapsed = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalDays = endDate 
      ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      : null;
    
    const timeProgress = totalDays ? Math.min((daysElapsed / totalDays) * 100, 100) : null;
    const isOnTrack = timeProgress ? challenge.progress >= timeProgress : true;
    
    const daysRemaining = endDate && endDate > now 
      ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Calculate estimated completion date based on current progress rate
    let estimatedCompletion = null;
    if (challenge.progress > 0 && challenge.progress < 100 && daysElapsed > 0) {
      const progressRate = challenge.progress / daysElapsed; // progress per day
      const remainingProgress = 100 - challenge.progress;
      const estimatedDaysToComplete = remainingProgress / progressRate;
      estimatedCompletion = new Date(now.getTime() + (estimatedDaysToComplete * 24 * 60 * 60 * 1000));
    }

    const progressMetrics = {
      current: challenge.progress,
      timeElapsed: {
        days: daysElapsed,
        percentage: timeProgress,
      },
      remaining: {
        progress: 100 - challenge.progress,
        days: daysRemaining,
      },
      pace: {
        isOnTrack,
        estimatedCompletion,
        progressPerDay: daysElapsed > 0 ? challenge.progress / daysElapsed : 0,
      },
      milestones: {
        quarter: challenge.progress >= 25,
        half: challenge.progress >= 50,
        threeQuarters: challenge.progress >= 75,
        complete: challenge.progress === 100,
      },
    };

    return NextResponse.json({
      challenge,
      metrics: progressMetrics,
    });
  } catch (error) {
    console.error('Error fetching challenge progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 