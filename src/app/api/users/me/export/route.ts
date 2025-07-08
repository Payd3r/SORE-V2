import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        const userId = session.user.id;
        
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.coupleId) {
            return NextResponse.json({ error: 'User or couple not found' }, { status: 404 });
        }
        const coupleId = user.coupleId;

        // Recupera tutti i dati associati all'utente e alla coppia
        const couple = await prisma.couple.findUnique({ where: { id: coupleId } });
        const memories = await prisma.memory.findMany({ where: { coupleId }, include: { images: true } });
        const moments = await prisma.moment.findMany({ where: { coupleId } });
        const challenges = await prisma.challenge.findMany({ where: { coupleId } });
        const ideas = await prisma.ideas.findMany({ where: { coupleId } });
        const notifications = await prisma.notification.findMany({ where: { userId } });

        const exportData = {
            exportedAt: new Date().toISOString(),
            user: {
                id: user?.id,
                name: user?.name,
                email: user?.email,
            },
            couple,
            memories,
            moments,
            challenges,
            ideas,
            notifications,
        };

        const fileName = `sore-data-export-${userId}-${new Date().toISOString().split('T')[0]}.json`;

        return new NextResponse(JSON.stringify(exportData, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="${fileName}"`,
            },
        });

    } catch (error) {
        console.error('Errore durante l\'esportazione dei dati:', error);
        return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
    }
} 