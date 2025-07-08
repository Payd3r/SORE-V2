import { PrismaClient } from '@prisma/client';
import { sendPushNotificationToUser } from '../src/lib/push-notifications';
import { sub, add } from 'date-fns';

const prisma = new PrismaClient();

const NOTIFICATION_WINDOWS = [
    { days: 1, label: 'domani' },
    { days: 7, label: 'tra una settimana' },
];

async function sendCountdownNotifications() {
    console.log('Inizio controllo notifiche per conti alla rovescia...');
    
    const now = new Date();

    for (const window of NOTIFICATION_WINDOWS) {
        const targetDateStart = add(now, { days: window.days, hours: -12 });
        const targetDateEnd = add(now, { days: window.days, hours: 12 });

        try {
            const countdowns = await prisma.countdown.findMany({
                where: {
                    date: {
                        gte: targetDateStart,
                        lt: targetDateEnd,
                    },
                },
                include: {
                    couple: {
                        include: {
                            users: true,
                        },
                    },
                },
            });

            if (countdowns.length > 0) {
                console.log(`Trovati ${countdowns.length} eventi che si terranno ${window.label}.`);
            }

            for (const countdown of countdowns) {
                const payload = {
                    title: 'Evento in Avvicinamento!',
                    body: `Ricorda: "${countdown.title}" è ${window.label}!`,
                    icon: '/icons/icon-192x192.png',
                    badge: '/icons/badge-72x72.png',
                    tag: `countdown-${countdown.id}`,
                    data: {
                        url: `/countdowns`,
                    },
                };

                for (const user of countdown.couple.users) {
                    console.log(`Invio notifica a ${user.email} per l'evento "${countdown.title}"`);
                    await sendPushNotificationToUser(user.id, payload);
                }
            }
        } catch (error) {
            console.error(`Errore durante il recupero dei conti alla rovescia per la finestra di ${window.days} giorni:`, error);
        }
    }
    
    console.log('Controllo notifiche completato.');
}

sendCountdownNotifications()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    }); 