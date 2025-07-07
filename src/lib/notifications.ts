import { prisma } from './prisma';
import { Notification } from '@prisma/client';

// Tipi di notifiche
export enum NotificationType {
  MOMENT_CREATED = 'moment_created',
  MOMENT_READY = 'moment_ready',
  MOMENT_PARTNER_CAPTURED = 'moment_partner_captured',
  MOMENT_COMPLETED = 'moment_completed',
  MOMENT_EXPIRED = 'moment_expired',
  MEMORY_CREATED = 'memory_created',
  ANNIVERSARY_REMINDER = 'anniversary_reminder',
  IDEA_ADDED = 'idea_added',
  CHALLENGE_COMPLETED = 'challenge_completed',
}

// Interfaccia per i metadata delle notifiche
interface NotificationMetadata {
  momentId?: string;
  memoryId?: string;
  ideaId?: string;
  challengeId?: string;
  partnerName?: string;
  momentExpiresAt?: string;
  [key: string]: any;
}

interface CreateNotificationData {
  userId: string;
  coupleId?: string;
  type: string;
  message: string;
  relatedId?: string;
  deepLink?: string;
}

/**
 * Creates a new notification in the database.
 * This is the core function for the persistent notification system.
 *
 * @param data - The data for the notification.
 * @returns The created notification.
 */
export async function createNotification(data: CreateNotificationData): Promise<Notification> {
  try {
    const notification = await prisma.notification.create({
      data,
    });

    // TODO: Implement real-time notification delivery (WebSocket, Push)

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    throw new Error('Could not create notification.');
  }
}

/**
 * Retrieves all notifications for a specific user.
 *
 * @param userId - The ID of the user.
 * @returns A list of notifications for the user.
 */
export async function getNotificationsForUser(userId: string): Promise<Notification[]> {
  try {
    return await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('Failed to retrieve notifications:', error);
    throw new Error('Could not retrieve notifications.');
  }
}

/**
 * Retrieves all unread notifications for a specific user.
 */
export async function getUnreadNotifications(userId: string) {
  return prisma.notification.findMany({
    where: {
      userId: userId,
      isRead: false,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Marks a specific notification as read.
 *
 * @param notificationId - The ID of the notification to mark as read.
 * @returns The updated notification.
 */
export async function markNotificationAsRead(notificationId: string): Promise<Notification> {
  try {
    return await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    throw new Error('Could not mark notification as read.');
  }
}

/**
 * Marks multiple notifications as read for a user.
 * If no notificationIds are provided, all unread notifications for the user will be marked as read.
 */
export async function markNotificationsAsRead(userId: string, notificationIds?: string[]) {
  const whereClause: any = { userId: userId, isRead: false };
  if (notificationIds && notificationIds.length > 0) {
    whereClause.id = { in: notificationIds };
  }

  return prisma.notification.updateMany({
    where: whereClause,
    data: {
      isRead: true,
    },
  });
}

// Notifica partner quando un momento viene creato
export async function notifyMomentCreated(momentId: string, initiatorId: string, participantId?: string) {
  if (!participantId) {
    console.log('Nessun partecipante specificato, notifica non inviata');
    return;
  }

  try {
    // Ottieni informazioni del momento e dell'initiator
    const moment = await prisma.moment.findUnique({
      where: { id: momentId },
      select: {
        id: true,
        coupleId: true,
        memoryId: true,
        expiresAt: true,
        initiator: {
          select: { name: true }
        },
        memory: {
          select: { title: true, location: true }
        }
      }
    });

    if (!moment) {
      throw new Error('Momento non trovato');
    }

    const title = '📸 Nuovo Momento Creato!';
    const memoryContext = moment.memory ? ` per la memoria "${moment.memory.title}"` : '';
    const locationContext = moment.memory?.location ? ` a ${moment.memory.location}` : '';
    const message = `${moment.initiator.name || 'Il tuo partner'} ha creato un nuovo momento${memoryContext}${locationContext}. È il momento di catturare insieme questo ricordo speciale!`;

    const metadata: NotificationMetadata = {
      momentId,
      partnerName: moment.initiator.name || 'Partner',
      momentExpiresAt: moment.expiresAt?.toISOString(),
      memoryId: moment.memoryId || undefined
    };

    await createNotification({
      userId: participantId,
      coupleId: moment.coupleId,
      type: NotificationType.MOMENT_CREATED,
      message,
      relatedId: momentId,
      deepLink: `/moments/${momentId}`,
    });

    console.log(`Notifica momento creato inviata a ${participantId}`);
  } catch (error) {
    console.error('Errore nell\'invio notifica momento creato:', error);
  }
}

// Notifica quando un partner ha catturato
export async function notifyPartnerCaptured(momentId: string, capturedById: string, partnerId: string) {
  try {
    // Ottieni informazioni del momento e di chi ha catturato
    const moment = await prisma.moment.findUnique({
      where: { id: momentId },
      select: {
        id: true,
        coupleId: true,
        memoryId: true,
        initiator: {
          select: { id: true, name: true }
        },
        participant: {
          select: { id: true, name: true }
        },
        memory: {
          select: { title: true }
        }
      }
    });

    if (!moment) {
      throw new Error('Momento non trovato');
    }

    // Determina chi ha catturato
    const capturedBy = moment.initiator.id === capturedById ? moment.initiator : moment.participant;
    if (!capturedBy) {
      throw new Error('Chi ha catturato non trovato');
    }

    const title = '📷 Partner ha Catturato!';
    const memoryContext = moment.memory ? ` per "${moment.memory.title}"` : '';
    const message = `${capturedBy.name || 'Il tuo partner'} ha catturato la sua parte del momento${memoryContext}. È il tuo turno per completare il ricordo!`;

    const metadata: NotificationMetadata = {
      momentId,
      partnerName: capturedBy.name || 'Partner',
      memoryId: moment.memoryId || undefined
    };

    await createNotification({
      userId: partnerId,
      coupleId: moment.coupleId,
      type: NotificationType.MOMENT_PARTNER_CAPTURED,
      message,
      relatedId: momentId,
      deepLink: `/moments/${momentId}`,
    });

    console.log(`Notifica partner catturato inviata a ${partnerId}`);
  } catch (error) {
    console.error('Errore nell\'invio notifica partner catturato:', error);
  }
}

// Notifica quando un momento è completato
export async function notifyMomentCompleted(momentId: string) {
  try {
    // Ottieni informazioni del momento e della coppia
    const moment = await prisma.moment.findUnique({
      where: { id: momentId },
      select: {
        id: true,
        coupleId: true,
        memoryId: true,
        couple: {
          include: {
            users: {
              select: { id: true }
            }
          }
        },
        memory: {
          select: { title: true, location: true }
        }
      }
    });

    if (!moment || !moment.couple) {
      throw new Error('Momento o coppia non trovati');
    }

    const title = '🎉 Momento Completato!';
    const memoryContext = moment.memory ? ` di "${moment.memory.title}"` : '';
    const locationContext = moment.memory?.location ? ` a ${moment.memory.location}` : '';
    const message = `Fantastico! Avete completato insieme il momento${memoryContext}${locationContext}. Il vostro ricordo condiviso è stato creato!`;

    const metadata: NotificationMetadata = {
      momentId,
      memoryId: moment.memoryId || undefined
    };

    // Invia notifica a entrambi i partner
    for (const user of moment.couple.users) {
      await createNotification({
        userId: user.id,
        coupleId: moment.coupleId,
        type: NotificationType.MOMENT_COMPLETED,
        message,
        relatedId: momentId,
        deepLink: `/moments/${momentId}`,
      });
    }

    console.log(`Notifica momento completato inviata alla coppia ${moment.coupleId}`);
  } catch (error) {
    console.error('Errore nell\'invio notifica momento completato:', error);
  }
}

// Notifica quando un momento è scaduto
export async function notifyMomentExpired(momentId: string) {
  try {
    const moment = await prisma.moment.findUnique({
      where: { id: momentId },
      select: {
        id: true,
        coupleId: true,
        memoryId: true,
        initiatorId: true,
        participantId: true,
        memory: {
          select: { title: true }
        }
      }
    });

    if (!moment) {
      throw new Error('Momento non trovato');
    }

    // Determina gli ID degli utenti da notificare
    const userIds = [moment.initiatorId, moment.participantId].filter(Boolean) as string[];
    if (userIds.length === 0) {
        console.log('Nessun utente da notificare per il momento scaduto');
        return;
    }

    const title = '⏳ Momento Scaduto';
    const memoryContext = moment.memory ? ` per "${moment.memory.title}"` : '';
    const message = `Il momento${memoryContext} è scaduto. Potete riprovare a creare un nuovo ricordo insieme!`;

    const metadata: NotificationMetadata = {
      momentId,
      memoryId: moment.memoryId || undefined
    };

    for (const userId of userIds) {
      await createNotification({
        userId,
        coupleId: moment.coupleId,
        type: NotificationType.MOMENT_EXPIRED,
        message,
        relatedId: momentId,
        deepLink: `/memories/${moment.memoryId || ''}`,
      });
    }

    console.log(`Notifica momento scaduto inviata a ${userIds.join(', ')}`);
  } catch (error) {
    console.error('Errore nell\'invio notifica momento scaduto:', error);
  }
}

/**
 * Sends anniversary reminders to couples.
 * This function should be run daily by a scheduled job.
 */
export async function sendAnniversaryReminders() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const oneWeekFromToday = new Date(today);
  oneWeekFromToday.setDate(today.getDate() + 7);

  try {
    const couples = await prisma.couple.findMany({
      where: {
        anniversary: {
          not: null,
        },
      },
      include: {
        users: {
          select: {
            id: true,
          },
        },
      },
    });

    for (const couple of couples) {
      if (!couple.anniversary) continue;

      const anniversaryDate = new Date(couple.anniversary);
      anniversaryDate.setHours(0, 0, 0, 0);
      
      const anniversaryMonth = anniversaryDate.getMonth();
      const anniversaryDay = anniversaryDate.getDate();
      
      const thisYearAnniversary = new Date(today.getFullYear(), anniversaryMonth, anniversaryDay);
      const nextYearAnniversary = new Date(today.getFullYear() + 1, anniversaryMonth, anniversaryDay);
      
      const targetAnniversary = thisYearAnniversary >= today ? thisYearAnniversary : nextYearAnniversary;
      
      const daysDifference = Math.ceil((targetAnniversary.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      let shouldNotify = false;
      let message = '';
      
      if (daysDifference === 7) {
        shouldNotify = true;
        message = `🎉 Il vostro anniversario è tra una settimana! Iniziate a pianificare qualcosa di speciale per il ${targetAnniversary.toLocaleDateString('it-IT')}.`;
      } else if (daysDifference === 1) {
        shouldNotify = true;
        message = `💕 Il vostro anniversario è domani! Non dimenticate di celebrare questo giorno speciale.`;
      } else if (daysDifference === 0) {
        shouldNotify = true;
        message = `🎊 Buon anniversario! Oggi è il vostro giorno speciale. Auguriamo a voi due una giornata meravigliosa!`;
      }
      
      if (shouldNotify) {
        for (const user of couple.users) {
          await createNotification({
            userId: user.id,
            coupleId: couple.id,
            type: NotificationType.ANNIVERSARY_REMINDER,
            message,
            deepLink: `/timeline?anniversary=true`,
          });
        }
        
        console.log(`Promemoria anniversario inviato per la coppia ${couple.id}`);
      }
    }
  } catch (error) {
    console.error('Errore nell\'invio promemoria anniversario:', error);
  }
}

// ===== CONTENT-BASED NOTIFICATION FUNCTIONS =====

/**
 * Notifica quando viene creata una nuova memoria
 */
export async function notifyMemoryCreated(memoryId: string, createdById: string, coupleId: string) {
  try {
    const memory = await prisma.memory.findUnique({
      where: { id: memoryId },
      select: {
        id: true,
        title: true,
        location: true,
        createdBy: {
          select: { name: true }
        },
        couple: {
          select: {
            users: {
              select: { id: true },
              where: { id: { not: createdById } }
            }
          }
        }
      }
    });

    if (!memory) {
      throw new Error('Memoria non trovata');
    }

    const partnerUsers = memory.couple.users;
    if (partnerUsers.length === 0) {
      console.log('Nessun partner da notificare per la nuova memoria');
      return;
    }

    const locationContext = memory.location ? ` a ${memory.location}` : '';
    const message = `💝 ${memory.createdBy.name || 'Il tuo partner'} ha creato una nuova memoria "${memory.title}"${locationContext}. Vai a vedere!`;

    for (const partner of partnerUsers) {
      await createNotification({
        userId: partner.id,
        coupleId,
        type: NotificationType.MEMORY_CREATED,
        message,
        relatedId: memoryId,
        deepLink: `/memories/${memoryId}`,
      });
    }

    console.log(`Notifica nuova memoria inviata per ${partnerUsers.length} partner(s)`);
  } catch (error) {
    console.error('Errore nell\'invio notifica nuova memoria:', error);
  }
}

/**
 * Notifica quando vengono caricate nuove immagini
 */
export async function notifyNewImages(imageIds: string[], uploadedById: string, coupleId: string) {
  try {
    const images = await prisma.image.findMany({
      where: { id: { in: imageIds } },
      select: {
        id: true,
        filename: true,
        memory: {
          select: { title: true, location: true }
        }
      }
    });

    if (images.length === 0) {
      console.log('Nessuna immagine trovata per la notifica');
      return;
    }

    const uploader = await prisma.user.findUnique({
      where: { id: uploadedById },
      select: { name: true }
    });

    const couple = await prisma.couple.findUnique({
      where: { id: coupleId },
      select: {
        users: {
          select: { id: true },
          where: { id: { not: uploadedById } }
        }
      }
    });

    if (!couple || couple.users.length === 0) {
      console.log('Nessun partner da notificare per le nuove immagini');
      return;
    }

    const imageCount = images.length;
    const imageText = imageCount === 1 ? 'una nuova foto' : `${imageCount} nuove foto`;
    const memoryContext = images[0].memory ? ` per "${images[0].memory.title}"` : '';
    const message = `📸 ${uploader?.name || 'Il tuo partner'} ha caricato ${imageText}${memoryContext}. Dai un'occhiata!`;

    for (const partner of couple.users) {
      await createNotification({
        userId: partner.id,
        coupleId,
        type: 'new_images',
        message,
        relatedId: imageIds[0], // Usa la prima immagine come riferimento
        deepLink: `/gallery?new=true`,
      });
    }

    console.log(`Notifica nuove immagini inviata per ${couple.users.length} partner(s)`);
  } catch (error) {
    console.error('Errore nell\'invio notifica nuove immagini:', error);
  }
}

/**
 * Notifica quando viene aggiunta una nuova idea
 */
export async function notifyIdeaAdded(ideaId: string, createdById: string, coupleId: string) {
  try {
    const idea = await prisma.ideas.findUnique({
      where: { id: ideaId },
      select: {
        id: true,
        title: true,
        category: true,
        createdBy: {
          select: { name: true }
        },
        couple: {
          select: {
            users: {
              select: { id: true },
              where: { id: { not: createdById } }
            }
          }
        }
      }
    });

    if (!idea) {
      throw new Error('Idea non trovata');
    }

    const partnerUsers = idea.couple.users;
    if (partnerUsers.length === 0) {
      console.log('Nessun partner da notificare per la nuova idea');
      return;
    }

    const categoryContext = idea.category ? ` nella categoria ${idea.category}` : '';
    const message = `💡 ${idea.createdBy.name || 'Il tuo partner'} ha aggiunto una nuova idea "${idea.title}"${categoryContext}. Che ne pensi?`;

    for (const partner of partnerUsers) {
      await createNotification({
        userId: partner.id,
        coupleId,
        type: NotificationType.IDEA_ADDED,
        message,
        relatedId: ideaId,
        deepLink: `/ideas/${ideaId}`,
      });
    }

    console.log(`Notifica nuova idea inviata per ${partnerUsers.length} partner(s)`);
  } catch (error) {
    console.error('Errore nell\'invio notifica nuova idea:', error);
  }
}

/**
 * Notifica quando viene completata una sfida
 */
export async function notifyChallengeCompleted(challengeId: string, completedById: string, coupleId: string) {
  try {
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      select: {
        id: true,
        title: true,
        category: true,
        difficulty: true,
        completedBy: {
          select: { name: true }
        },
        couple: {
          select: {
            users: {
              select: { id: true },
              where: { id: { not: completedById } }
            }
          }
        }
      }
    });

    if (!challenge) {
      throw new Error('Sfida non trovata');
    }

    const partnerUsers = challenge.couple.users;
    if (partnerUsers.length === 0) {
      console.log('Nessun partner da notificare per la sfida completata');
      return;
    }

    const difficultyEmoji = challenge.difficulty === 'hard' ? '🔥' : challenge.difficulty === 'medium' ? '⭐' : '✨';
    const message = `${difficultyEmoji} ${challenge.completedBy.name || 'Il tuo partner'} ha completato la sfida "${challenge.title}"! Congratulazioni!`;

    for (const partner of partnerUsers) {
      await createNotification({
        userId: partner.id,
        coupleId,
        type: NotificationType.CHALLENGE_COMPLETED,
        message,
        relatedId: challengeId,
        deepLink: `/challenges/${challengeId}`,
      });
    }

    console.log(`Notifica sfida completata inviata per ${partnerUsers.length} partner(s)`);
  } catch (error) {
    console.error('Errore nell\'invio notifica sfida completata:', error);
  }
}

/**
 * Notifica quando viene caricato un nuovo contenuto generico
 */
export async function notifyContentUploaded(contentType: string, contentId: string, uploadedById: string, coupleId: string, contentTitle?: string) {
  try {
    const uploader = await prisma.user.findUnique({
      where: { id: uploadedById },
      select: { name: true }
    });

    const couple = await prisma.couple.findUnique({
      where: { id: coupleId },
      select: {
        users: {
          select: { id: true },
          where: { id: { not: uploadedById } }
        }
      }
    });

    if (!couple || couple.users.length === 0) {
      console.log('Nessun partner da notificare per il nuovo contenuto');
      return;
    }

    const contentTypeMap: { [key: string]: string } = {
      'video': '🎥 un nuovo video',
      'audio': '🎵 un nuovo audio',
      'document': '📄 un nuovo documento',
      'other': '📎 un nuovo file'
    };

    const contentDescription = contentTypeMap[contentType] || '📎 un nuovo contenuto';
    const titleContext = contentTitle ? ` "${contentTitle}"` : '';
    const message = `${contentDescription}${titleContext} è stato caricato da ${uploader?.name || 'il tuo partner'}. Dai un'occhiata!`;

    for (const partner of couple.users) {
      await createNotification({
        userId: partner.id,
        coupleId,
        type: 'content_uploaded',
        message,
        relatedId: contentId,
        deepLink: `/content/${contentId}`,
      });
    }

    console.log(`Notifica nuovo contenuto inviata per ${couple.users.length} partner(s)`);
  } catch (error) {
    console.error('Errore nell\'invio notifica nuovo contenuto:', error);
  }
}

/**
 * Cleans up old notifications older than the specified number of days.
 * This function should be run periodically to prevent database bloat.
 */
export async function cleanupOldNotifications(daysOld: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  try {
    const result = await prisma.notification.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        isRead: true, // Only delete read notifications
      },
    });

    console.log(`Cleaned up ${result.count} old notifications`);
    return result.count;
  } catch (error) {
    console.error('Error cleaning up old notifications:', error);
    throw new Error('Could not clean up old notifications.');
  }
}

/**
 * Checks for expired moments and updates their status while sending notifications.
 * This function should be run periodically (e.g., every hour) to handle moment expiration.
 */
export async function processExpiredMoments() {
  const now = new Date();
  
  try {
    // Find all moments that have expired but are not yet marked as expired
    const expiredMoments = await prisma.moment.findMany({
      where: {
        expiresAt: {
          lt: now,
        },
        status: {
          notIn: ['completed', 'expired'],
        },
      },
      include: {
        memory: {
          select: { title: true },
        },
      },
    });

    if (expiredMoments.length === 0) {
      console.log('No expired moments found');
      return { processedCount: 0 };
    }

    console.log(`Found ${expiredMoments.length} expired moments to process`);

    // Update all expired moments to expired status
    const updateResult = await prisma.moment.updateMany({
      where: {
        id: {
          in: expiredMoments.map(moment => moment.id),
        },
      },
      data: {
        status: 'expired',
      },
    });

    // Send notifications for each expired moment
    for (const moment of expiredMoments) {
      try {
        await notifyMomentExpired(moment.id);
      } catch (notificationError) {
        console.error(`Failed to send expiration notification for moment ${moment.id}:`, notificationError);
        // Continue processing other moments even if one notification fails
      }
    }

    console.log(`Successfully processed ${updateResult.count} expired moments`);
    return { processedCount: updateResult.count };

  } catch (error) {
    console.error('Error processing expired moments:', error);
    throw new Error('Could not process expired moments.');
  }
} 