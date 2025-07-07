import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  challengeCategories, 
  challengeDifficulties, 
  challengeStatuses,
  challengeTemplates,
  getCategoryById,
  getTemplatesByCategory,
  getTemplatesByDifficulty
} from '@/lib/challenge-categories';

// GET /api/challenges/categories - Get challenge categories, difficulties, statuses, and templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const include = searchParams.get('include')?.split(',') || [];
    const categoryId = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');

    const response: any = {};

    // Always include categories, difficulties, and statuses
    response.categories = challengeCategories.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description,
      color: category.color,
      examples: category.examples,
      // Don't include icon component, just the name
      iconName: category.icon.name || 'Heart',
    }));

    response.difficulties = challengeDifficulties;
    response.statuses = challengeStatuses;

    // Include templates if requested or if specific filters are applied
    if (include.includes('templates') || categoryId || difficulty) {
      let templates = challengeTemplates;

      if (categoryId) {
        templates = getTemplatesByCategory(categoryId);
      }

      if (difficulty) {
        templates = getTemplatesByDifficulty(difficulty);
      }

      response.templates = templates;
    }

    // Include category-specific information if requested
    if (categoryId) {
      const category = getCategoryById(categoryId);
      if (category) {
        response.selectedCategory = {
          ...category,
          iconName: category.icon.name || 'Heart',
        };
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching challenge categories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 