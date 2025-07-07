import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for linking idea to memory
const linkIdeaToMemorySchema = z.object({
  memoryId: z.string().cuid('Invalid memory ID'),
});

// PUT /api/ideas/[id]/memory - Link an idea to a memory
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

    const body = await request.json();
    const validatedData = linkIdeaToMemorySchema.parse(body);

    // Check if the user is part of a couple
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { couple: true },
    });

    if (!user?.couple) {
      return NextResponse.json({ error: 'User not part of a couple' }, { status: 400 });
    }

    // Check if the idea exists and belongs to the user's couple
    const idea = await prisma.ideas.findUnique({
      where: { id },
      include: { couple: true },
    });

    if (!idea) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    if (idea.coupleId !== user.couple.id) {
      return NextResponse.json({ error: 'Unauthorized - Idea does not belong to your couple' }, { status: 403 });
    }

    // Check if the memory exists and belongs to the user's couple
    const memory = await prisma.memory.findUnique({
      where: { id: validatedData.memoryId },
      include: { couple: true },
    });

    if (!memory) {
      return NextResponse.json({ error: 'Memory not found' }, { status: 404 });
    }

    if (memory.coupleId !== user.couple.id) {
      return NextResponse.json({ error: 'Unauthorized - Memory does not belong to your couple' }, { status: 403 });
    }

    // Link the idea to the memory
    const updatedIdea = await prisma.ideas.update({
      where: { id },
      data: {
        memoryId: validatedData.memoryId,
      },
      include: {
        memory: {
          select: {
            id: true,
            title: true,
            description: true,
            date: true,
            location: true,
          },
        },
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Idea successfully linked to memory',
      idea: updatedIdea,
    });

  } catch (error) {
    console.error('Error linking idea to memory:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/ideas/[id]/memory - Unlink an idea from a memory
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

    // Check if the user is part of a couple
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { couple: true },
    });

    if (!user?.couple) {
      return NextResponse.json({ error: 'User not part of a couple' }, { status: 400 });
    }

    // Check if the idea exists and belongs to the user's couple
    const idea = await prisma.ideas.findUnique({
      where: { id },
      include: { couple: true },
    });

    if (!idea) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    if (idea.coupleId !== user.couple.id) {
      return NextResponse.json({ error: 'Unauthorized - Idea does not belong to your couple' }, { status: 403 });
    }

    // Unlink the idea from the memory
    const updatedIdea = await prisma.ideas.update({
      where: { id },
      data: {
        memoryId: null,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Idea successfully unlinked from memory',
      idea: updatedIdea,
    });

  } catch (error) {
    console.error('Error unlinking idea from memory:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/ideas/[id]/memory - Get the memory linked to an idea
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

    // Check if the user is part of a couple
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { couple: true },
    });

    if (!user?.couple) {
      return NextResponse.json({ error: 'User not part of a couple' }, { status: 400 });
    }

    // Get the idea with its linked memory
    const idea = await prisma.ideas.findUnique({
      where: { id },
      include: {
        memory: {
          include: {
            images: {
              select: {
                id: true,
                filename: true,
                thumbnailPath: true,
              },
            },
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        couple: true,
      },
    });

    if (!idea) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    if (idea.coupleId !== user.couple.id) {
      return NextResponse.json({ error: 'Unauthorized - Idea does not belong to your couple' }, { status: 403 });
    }

    return NextResponse.json({
      idea: {
        id: idea.id,
        title: idea.title,
        description: idea.description,
        category: idea.category,
        status: idea.status,
        priority: idea.priority,
        dueDate: idea.dueDate,
        completedAt: idea.completedAt,
        createdAt: idea.createdAt,
        updatedAt: idea.updatedAt,
      },
      memory: idea.memory,
    });

  } catch (error) {
    console.error('Error getting idea memory:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 