import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { IDEA_CATEGORIES } from '@/lib/idea-categories';

// Interfaccia per le statistiche delle categorie
interface CategoryStats {
  categoryId: string;
  categoryName: string;
  icon: string;
  count: number;
  completedCount: number;
  pendingCount: number;
  completionRate: number;
}

// GET /api/ideas/categories - Ottiene tutte le categorie disponibili con statistiche
export async function GET(request: NextRequest) {
  try {
    // Autenticazione
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    // Trova la coppia dell'utente
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { coupleId: true }
    });

    if (!user?.coupleId) {
      return NextResponse.json(
        { error: 'Coppia non trovata' },
        { status: 404 }
      );
    }

    // Parametri di query
    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get('includeStats') === 'true';
    const onlyUsed = searchParams.get('onlyUsed') === 'true';

    // Se non servono statistiche, ritorna solo le categorie predefinite
    if (!includeStats && !onlyUsed) {
      return NextResponse.json({
        success: true,
        data: {
          categories: IDEA_CATEGORIES.map(cat => ({
            id: cat.id,
            name: cat.name,
            icon: cat.icon,
            description: cat.description,
          })),
        },
      });
    }

    // Ottieni le statistiche delle categorie dal database
    const categoryStats = await prisma.ideas.groupBy({
      by: ['category'],
      where: { coupleId: user.coupleId },
      _count: {
        category: true,
      },
    });

    // Ottieni le statistiche dettagliate per status
    const statusStats = await prisma.ideas.groupBy({
      by: ['category', 'status'],
      where: { coupleId: user.coupleId },
      _count: {
        status: true,
      },
    });

    // Combina statistiche con categorie predefinite
    const categoriesWithStats: CategoryStats[] = [];

    // Prima aggiungi le categorie che hanno dati nel database
    for (const stat of categoryStats) {
      const categoryDef = IDEA_CATEGORIES.find(cat => cat.id === stat.category);
      const categoryName = categoryDef ? categoryDef.name : stat.category || 'Senza categoria';
      const categoryIcon = categoryDef ? categoryDef.icon : '📝';
      
      const completedCount = statusStats
        .filter(s => s.category === stat.category && s.status === 'completed')
        .reduce((sum, s) => sum + s._count.status, 0);
      
      const pendingCount = statusStats
        .filter(s => s.category === stat.category && s.status === 'pending')
        .reduce((sum, s) => sum + s._count.status, 0);
      
      const totalCount = stat._count.category;
      const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

      categoriesWithStats.push({
        categoryId: stat.category || 'uncategorized',
        categoryName,
        icon: categoryIcon,
        count: totalCount,
        completedCount,
        pendingCount,
        completionRate: Math.round(completionRate * 100) / 100,
      });
    }

    // Se non è richiesto solo "onlyUsed", aggiungi le categorie predefinite non ancora usate
    if (!onlyUsed) {
      for (const categoryDef of IDEA_CATEGORIES) {
        if (!categoriesWithStats.find(cat => cat.categoryId === categoryDef.id)) {
          categoriesWithStats.push({
            categoryId: categoryDef.id,
            categoryName: categoryDef.name,
            icon: categoryDef.icon,
            count: 0,
            completedCount: 0,
            pendingCount: 0,
            completionRate: 0,
          });
        }
      }
    }

    // Ordina per numero di idee (decrescente) e poi per nome
    categoriesWithStats.sort((a, b) => {
      if (a.count !== b.count) {
        return b.count - a.count;
      }
      return a.categoryName.localeCompare(b.categoryName);
    });

    return NextResponse.json({
      success: true,
      data: {
        categories: includeStats ? categoriesWithStats : categoriesWithStats.map(cat => ({
          id: cat.categoryId,
          name: cat.categoryName,
          icon: cat.icon,
        })),
        stats: includeStats ? {
          totalCategories: categoriesWithStats.length,
          usedCategories: categoriesWithStats.filter(cat => cat.count > 0).length,
          mostUsedCategory: categoriesWithStats.find(cat => cat.count > 0) || null,
        } : undefined,
      },
    });

  } catch (error) {
    console.error('Errore nel recupero delle categorie:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

// POST /api/ideas/categories - Crea una nuova categoria personalizzata (opzionale)
export async function POST(request: NextRequest) {
  try {
    // Autenticazione
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, icon, description } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Il nome della categoria è obbligatorio' },
        { status: 400 }
      );
    }

    if (name.length > 50) {
      return NextResponse.json(
        { error: 'Il nome della categoria non può superare i 50 caratteri' },
        { status: 400 }
      );
    }

    // Crea un ID unico per la categoria personalizzata
    const categoryId = `custom_${name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}`;

    // Verifica che non esista già una categoria con questo ID
    if (IDEA_CATEGORIES.find(cat => cat.id === categoryId)) {
      return NextResponse.json(
        { error: 'Esiste già una categoria con questo nome' },
        { status: 400 }
      );
    }

    // Ritorna la nuova categoria (in questo caso non la salviamo nel DB, 
    // ma utilizziamo solo le categorie predefinite per semplicità)
    const newCategory = {
      id: categoryId,
      name: name.trim(),
      icon: icon || '📝',
      description: description || '',
      custom: true,
    };

    return NextResponse.json({
      success: true,
      data: newCategory,
      message: 'Categoria personalizzata creata. Nota: le categorie personalizzate sono temporanee.',
    }, { status: 201 });

  } catch (error) {
    console.error('Errore nella creazione della categoria:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
} 