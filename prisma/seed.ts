import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniziando seeding del database...')

  // Hash delle password per gli utenti di test
  const password1 = await bcrypt.hash('password123', 12)
  const password2 = await bcrypt.hash('password456', 12)

  // Creazione Couple di test
  const testCouple = await prisma.couple.create({
    data: {
      name: 'Marco & Sofia',
      inviteCode: 'LOVE2024',
      anniversary: new Date('2022-06-15'),
    },
  })
  console.log('✅ Coppia di test creata:', testCouple.name)

  // Creazione utenti di test
  const user1 = await prisma.user.create({
    data: {
      email: 'marco@example.com',
      name: 'Marco Rossi',
      password: password1,
      role: 'admin',
      coupleId: testCouple.id,
    },
  })

  const user2 = await prisma.user.create({
    data: {
      email: 'sofia@example.com',
      name: 'Sofia Bianchi',
      password: password2,
      role: 'member',
      coupleId: testCouple.id,
    },
  })
  console.log('✅ Utenti di test creati:', user1.name, 'e', user2.name)

  // Creazione Memory di test
  const memory1 = await prisma.memory.create({
    data: {
      title: 'Prima Vacanza insieme',
      description: 'Weekend romantico a Venezia per il nostro primo anniversario',
      date: new Date('2023-06-15'),
      location: 'Venezia, Italia',
      latitude: '45.4408',
      longitude: '12.3155',
      category: 'Viaggio',
      mood: '😍',
      weather: {
        temperature: 25,
        condition: 'Sunny',
        humidity: 60,
      },
      authorId: user1.id,
      coupleId: testCouple.id,
    },
  })

  const memory2 = await prisma.memory.create({
    data: {
      title: 'Cena di compleanno',
      description: 'Cena speciale al ristorante preferito di Sofia',
      date: new Date('2023-09-12'),
      location: 'Roma, Italia',
      latitude: '41.9028',
      longitude: '12.4964',
      category: 'Cena',
      mood: '🥰',
      authorId: user2.id,
      coupleId: testCouple.id,
    },
  })
  console.log('✅ Memorie di test create:', memory1.title, 'e', memory2.title)

  // Creazione Ideas di test
  const idea1 = await prisma.ideas.create({
    data: {
      title: 'Weekend alle Cinque Terre',
      description: 'Escursione e relax nei borghi liguri',
      category: 'Viaggio',
      status: 'pending',
      priority: 'high',
      dueDate: new Date('2024-08-15'),
      authorId: user1.id,
      coupleId: testCouple.id,
    },
  })

  const idea2 = await prisma.ideas.create({
    data: {
      title: 'Corso di cucina insieme',
      description: 'Imparare a cucinare piatti tradizionali italiani',
      category: 'Attività',
      status: 'in-progress',
      priority: 'medium',
      authorId: user2.id,
      coupleId: testCouple.id,
    },
  })
  console.log('✅ Idee di test create:', idea1.title, 'e', idea2.title)

  // Creazione Challenge di test
  const challenge1 = await prisma.challenge.create({
    data: {
      title: '30 giorni di appuntamenti creativi',
      description: 'Un appuntamento creativo ogni giorno per 30 giorni',
      category: 'Relazione',
      difficulty: 'medium',
      status: 'active',
      progress: 15,
      reward: 'Weekend spa per due',
      endDate: new Date('2024-08-30'),
      coupleId: testCouple.id,
    },
  })
  console.log('✅ Sfida di test creata:', challenge1.title)

  // Creazione Notifications di test
  const notification1 = await prisma.notification.create({
    data: {
      title: 'Nuovo ricordo aggiunto',
      message: `${user2.name} ha aggiunto un nuovo ricordo: "${memory2.title}"`,
      type: 'memory',
      metadata: {
        memoryId: memory2.id,
        authorName: user2.name,
      },
      userId: user1.id,
    },
  })

  const notification2 = await prisma.notification.create({
    data: {
      title: 'Anniversario in arrivo',
      message: 'Il vostro anniversario è tra una settimana!',
      type: 'anniversary',
      metadata: {
        date: testCouple.anniversary,
        daysLeft: 7,
      },
      userId: user1.id,
    },
  })
  console.log('✅ Notifiche di test create')

  // Creazione Moment di test
  const moment1 = await prisma.moment.create({
    data: {
      status: 'completed',
      completedAt: new Date('2023-12-25'),
      combinedImagePath: '/uploads/moments/christmas-2023.jpg',
      initiatorId: user1.id,
      participantId: user2.id,
      coupleId: testCouple.id,
      memoryId: memory1.id,
    },
  })
  console.log('✅ Momento di test creato')

  // Creazione Images di test
  const image1 = await prisma.image.create({
    data: {
      filename: 'venice-sunset.jpg',
      originalName: 'IMG_001.jpg',
      mimeType: 'image/jpeg',
      size: 2048576,
      width: 1920,
      height: 1080,
      path: '/uploads/images/venice-sunset.jpg',
      thumbnailPath: '/uploads/thumbnails/venice-sunset-thumb.jpg',
      category: 'Landscape',
      metadata: {
        camera: 'iPhone 14 Pro',
        location: 'Venezia',
        timestamp: '2023-06-15T18:30:00Z',
      },
      hash: 'abc123def456',
      isFavorite: true,
      memoryId: memory1.id,
    },
  })

  const image2 = await prisma.image.create({
    data: {
      filename: 'dinner-date.jpg',
      originalName: 'IMG_002.jpg',
      mimeType: 'image/jpeg',
      size: 1524288,
      width: 1080,
      height: 1080,
      path: '/uploads/images/dinner-date.jpg',
      thumbnailPath: '/uploads/thumbnails/dinner-date-thumb.jpg',
      category: 'Couple',
      metadata: {
        camera: 'iPhone 13',
        location: 'Roma',
        timestamp: '2023-09-12T20:15:00Z',
      },
      hash: 'def456ghi789',
      isFavorite: false,
      memoryId: memory2.id,
    },
  })
  console.log('✅ Immagini di test create')

  console.log('🎉 Seeding completato con successo!')
  console.log(`
📊 Dati creati:
- 1 Coppia: ${testCouple.name}
- 2 Utenti: ${user1.name}, ${user2.name}
- 2 Memorie: ${memory1.title}, ${memory2.title}
- 2 Idee: ${idea1.title}, ${idea2.title}
- 1 Sfida: ${challenge1.title}
- 2 Notifiche
- 1 Momento
- 2 Immagini

🔐 Credenziali di test:
- Email: marco@example.com | Password: password123
- Email: sofia@example.com | Password: password456
- Codice invito coppia: LOVE2024
`)
}

main()
  .catch((e) => {
    console.error('❌ Errore durante il seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 