import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/roles';

// Interfaccia per opzioni di condivisione
interface ShareOptions {
  type: 'link' | 'email' | 'social' | 'download';
  format?: 'original' | 'combined' | 'collage';
  quality?: 'original' | 'high' | 'medium' | 'low';
  includeMetadata?: boolean;
  expiresIn?: number; // giorni, 0 = no expiry
  password?: string;
  recipientEmail?: string;
  socialPlatform?: 'instagram' | 'facebook' | 'twitter' | 'whatsapp';
}

// Interfaccia per risultato condivisione
interface ShareResult {
  shareId: string;
  shareUrl?: string;
  downloadUrl?: string;
  socialShareText?: string;
  expiresAt?: string;
  qrCode?: string;
}

/**
 * POST /api/moments/[id]/share
 * 
 * Crea un link o risorsa di condivisione per un momento specifico
 * con opzioni avanzate per diversi tipi di sharing
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: momentId } = await params;
    
    // Autenticazione
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autenticato' },
        { status: 401 }
      );
    }

    // Verifica permessi
    if (!hasPermission(session.user.role, 'memory:read')) {
      return NextResponse.json(
        { error: 'Permessi insufficienti' },
        { status: 403 }
      );
    }

    // Parse opzioni di condivisione
    const shareOptions: ShareOptions = await request.json();

    // Verifica che il momento esista e appartenga alla coppia dell'utente
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { couple: true }
    });

    if (!user?.couple) {
      return NextResponse.json(
        { error: 'Utente non appartiene a nessuna coppia' },
        { status: 400 }
      );
    }

    const moment = await prisma.moment.findUnique({
      where: { id: momentId },
      include: {
        couple: true,
        initiator: {
          select: { id: true, name: true, email: true }
        },
        participant: {
          select: { id: true, name: true, email: true }
        },
        images: {
          select: {
            id: true,
            filename: true,
            originalName: true,
            path: true,
            thumbnailPath: true,
            size: true,
            width: true,
            height: true,
            metadata: true
          }
        },
        memory: {
          select: {
            id: true,
            title: true,
            date: true,
            location: true
          }
        }
      }
    });

    if (!moment || moment.coupleId !== user.couple.id) {
      return NextResponse.json(
        { error: 'Momento non trovato o non accessibile' },
        { status: 404 }
      );
    }

    console.log(`📤 Creando condivisione per momento ${momentId}, tipo: ${shareOptions.type}`);

    // Genera ID univoco per la condivisione
    const shareId = `share_${momentId}_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    
    // Calcola data di scadenza
    const expiresAt = shareOptions.expiresIn && shareOptions.expiresIn > 0
      ? new Date(Date.now() + shareOptions.expiresIn * 24 * 60 * 60 * 1000)
      : null;

    // Prepara metadati per la condivisione
    const shareMetadata = {
      momentId,
      shareId,
      format: shareOptions.format || 'combined',
      quality: shareOptions.quality || 'high',
      includeMetadata: shareOptions.includeMetadata || false,
      password: shareOptions.password,
      createdBy: session.user.id,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt?.toISOString(),
      accessCount: 0,
      lastAccessed: null
    };

    let result: ShareResult = {
      shareId,
      expiresAt: expiresAt?.toISOString()
    };

    // Gestisci diversi tipi di condivisione
    switch (shareOptions.type) {
      case 'link':
        // Crea link pubblico temporaneo
        const shareUrl = `${process.env.NEXTAUTH_URL}/share/moment/${shareId}`;
        
        // Salva nel database (se hai una tabella shares)
        // await prisma.share.create({ data: shareMetadata });
        
        result.shareUrl = shareUrl;
        result.qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`;
        break;

      case 'download':
        // Crea URL di download diretto
        const downloadUrl = `${process.env.NEXTAUTH_URL}/api/moments/${momentId}/download?shareId=${shareId}&format=${shareOptions.format}`;
        result.downloadUrl = downloadUrl;
        break;

      case 'email':
        // Prepara invio email (implementare con servizio email)
        if (!shareOptions.recipientEmail) {
          return NextResponse.json(
            { error: 'Email destinatario richiesta' },
            { status: 400 }
          );
        }
        
        // TODO: Implementare invio email
        result.shareUrl = `${process.env.NEXTAUTH_URL}/share/moment/${shareId}`;
        break;

      case 'social':
        // Prepara condivisione social media
        const socialText = generateSocialShareText(moment, shareOptions.socialPlatform);
        const socialUrl = `${process.env.NEXTAUTH_URL}/share/moment/${shareId}`;
        
        result.shareUrl = socialUrl;
        result.socialShareText = socialText;
        break;

      default:
        return NextResponse.json(
          { error: 'Tipo di condivisione non supportato' },
          { status: 400 }
        );
    }

    // Log dell'attività
    console.log(`✅ Condivisione creata: ${shareId} per momento ${momentId}`);

    // Crea notifica per il partner
    const partnerId = moment.initiatorId === session.user.id 
      ? moment.participantId 
      : moment.initiatorId;

    if (partnerId) {
      await prisma.notification.create({
        data: {
          title: 'Momento condiviso',
          message: `${session.user.name} ha condiviso un momento con te`,
          type: 'moment_shared',
          userId: partnerId,
          metadata: {
            momentId,
            shareId,
            shareType: shareOptions.type,
            sharedBy: session.user.id
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: result,
      moment: {
        id: moment.id,
        status: moment.status,
        createdAt: moment.createdAt,
        completedAt: moment.completedAt,
        imageCount: moment.images.length,
        participants: {
          initiator: moment.initiator?.name,
          participant: moment.participant?.name
        },
        memory: moment.memory ? {
          title: moment.memory.title,
          date: moment.memory.date,
          location: moment.memory.location
        } : null
      }
    });

  } catch (error) {
    console.error('❌ Errore nella condivisione momento:', error);
    return NextResponse.json(
      { 
        error: 'Errore interno del server',
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/moments/[id]/share
 * 
 * Ottiene le condivisioni esistenti per un momento
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: momentId } = await params;
    
    // Autenticazione
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autenticato' },
        { status: 401 }
      );
    }

    // Verifica accesso al momento
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { couple: true }
    });

    if (!user?.couple) {
      return NextResponse.json(
        { error: 'Utente non appartiene a nessuna coppia' },
        { status: 400 }
      );
    }

    const moment = await prisma.moment.findUnique({
      where: { id: momentId },
      include: { couple: true }
    });

    if (!moment || moment.coupleId !== user.couple.id) {
      return NextResponse.json(
        { error: 'Momento non trovato o non accessibile' },
        { status: 404 }
      );
    }

    // TODO: Recupera condivisioni dal database
    // const shares = await prisma.share.findMany({
    //   where: { momentId },
    //   orderBy: { createdAt: 'desc' }
    // });

    const mockShares = [
      {
        id: 'share_1',
        type: 'link',
        format: 'combined',
        createdAt: new Date().toISOString(),
        expiresAt: null,
        accessCount: 3,
        lastAccessed: new Date().toISOString()
      }
    ];

    return NextResponse.json({
      success: true,
      data: mockShares,
      total: mockShares.length
    });

  } catch (error) {
    console.error('❌ Errore nel recupero condivisioni:', error);
    return NextResponse.json(
      { 
        error: 'Errore interno del server',
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      },
      { status: 500 }
    );
  }
}

// Helper function per generare testo condivisione social
function generateSocialShareText(
  moment: any,
  platform?: string
): string {
  const baseText = `✨ Guarda questo momento speciale che abbiamo catturato insieme! `;
  
  const contextText = moment.memory?.title 
    ? `Durante "${moment.memory.title}"` 
    : `Il ${new Date(moment.createdAt).toLocaleDateString('it-IT')}`;
  
  const participants = moment.initiator && moment.participant
    ? `${moment.initiator.name} & ${moment.participant.name}`
    : 'La nostra coppia';

  switch (platform) {
    case 'instagram':
      return `${baseText} 📸 ${contextText} #MomentiInsieme #AmoreDiCoppia #Ricordi`;
    
    case 'facebook':
      return `${baseText} ${contextText}. Che bello condividere questi momenti speciali! ❤️`;
    
    case 'twitter':
      return `${baseText} ${contextText} #MomentiSpeciali #Coppia ❤️`;
    
    case 'whatsapp':
      return `${baseText} ${contextText} ❤️✨`;
    
    default:
      return `${baseText} ${contextText} - ${participants} ❤️`;
  }
} 