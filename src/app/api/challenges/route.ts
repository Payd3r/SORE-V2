import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for challenge creation
const createChallengeSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(100, 'Title too long'),
  description: z.string().trim().optional(),
  category: z.string().trim().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  reward: z.string().trim().optional(),
  endDate: z.string().datetime().optional(),
});

// Validation schema for query parameters
const getChallengesSchema = z.object({
  status: z.enum(['active', 'completed', 'paused']).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  category: z.string().trim().optional(),
  search: z.string().trim().optional(),
  sortBy: z.enum(['createdAt', 'progress', 'endDate', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

// GET /api/challenges - Get all challenges for the couple
export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    const validatedQuery = getChallengesSchema.parse(queryParams);
    
    const { 
      status, 
      difficulty, 
      category, 
      search, 
      sortBy, 
      sortOrder, 
      page, 
      limit 
    } = validatedQuery;

    // Build where clause
    const whereClause: any = {
      coupleId: user.couple.id,
    };

    if (status) whereClause.status = status;
    if (difficulty) whereClause.difficulty = difficulty;
    if (category) whereClause.category = category;
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get challenges with pagination
    const [challenges, totalCount] = await Promise.all([
      prisma.challenge.findMany({
        where: whereClause,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
        include: {
          couple: true,
        },
      }),
      prisma.challenge.count({ where: whereClause }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      challenges,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage,
        hasPrevPage,
        limit,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.errors }, { status: 400 });
    }
    
    console.error('Error fetching challenges:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/challenges - Create a new challenge
export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();
    const validatedData = createChallengeSchema.parse(body);

    const challenge = await prisma.challenge.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        category: validatedData.category,
        difficulty: validatedData.difficulty,
        reward: validatedData.reward,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
        coupleId: user.couple.id,
      },
      include: {
        couple: true,
      },
    });

    return NextResponse.json(challenge, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    
    console.error('Error creating challenge:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 