import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

async function testDatabaseInteractions() {
  console.log('🧪 Iniziando test delle interazioni database...\n')

  try {
    // Test 1: Lettura dei dati esistenti (READ)
    console.log('📖 Test 1: Lettura dati esistenti')
    const couples = await prisma.couple.findMany({
      include: {
        users: true,
        memories: true,
        ideas: true,
      },
    })
    console.log(`✅ Trovate ${couples.length} coppie`)
    console.log(`✅ Prima coppia: ${couples[0]?.name} con ${couples[0]?.users.length} utenti`)

    // Test 2: Creazione nuovo utente (CREATE)
    console.log('\n📝 Test 2: Creazione nuovo utente')
    const newUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Utente Test',
        password: 'hashed_password',
        role: 'member',
        coupleId: couples[0]?.id || 'default-couple-id',
      },
    })
    console.log(`✅ Nuovo utente creato: ${newUser.name} (ID: ${newUser.id})`)

    // Test 3: Aggiornamento utente (UPDATE)
    console.log('\n🔄 Test 3: Aggiornamento utente')
    const updatedUser = await prisma.user.update({
      where: { id: newUser.id },
      data: { name: 'Utente Test Aggiornato' },
    })
    console.log(`✅ Utente aggiornato: ${updatedUser.name}`)

    // Test 4: Test relazioni - Creazione memoria con autore
    console.log('\n🔗 Test 4: Test relazioni - Creazione memoria')
    const newMemory = await prisma.memory.create({
      data: {
        title: 'Memoria di Test',
        description: 'Una memoria creata durante i test',
        date: new Date(),
        location: 'Test Location',
        latitude: '45.0000',
        longitude: '9.0000',
        category: 'Test',
        mood: '🧪',
        authorId: newUser.id,
        coupleId: couples[0]?.id || 'default-couple-id',
      },
      include: {
        author: true,
        couple: true,
      },
    })
    console.log(`✅ Memoria creata: ${newMemory.title} by ${newMemory.author.name}`)

    // Test 5: Query complesse - Ricerca con filtri
    console.log('\n🔍 Test 5: Query complesse - Ricerca memorie per categoria')
    const testMemories = await prisma.memory.findMany({
      where: {
        category: 'Test',
      },
      include: {
        author: {
          select: {
            name: true,
            email: true,
          },
        },
        images: true,
      },
    })
    console.log(`✅ Trovate ${testMemories.length} memorie di test`)

    // Test 6: Test aggregazione - Conteggio per coppia
    console.log('\n📊 Test 6: Test aggregazione - Statistiche per coppia')
    const memoryCount = await prisma.memory.count({
      where: {
        coupleId: couples[0]?.id,
      },
    })
    console.log(`✅ Memorie totali per la coppia: ${memoryCount}`)

    // Test 7: Test transazioni - Operazioni multiple
    console.log('\n💾 Test 7: Test transazioni - Creazione idea con notifica')
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Crea una nuova idea
      const newIdea = await tx.ideas.create({
        data: {
          title: 'Idea di Test',
          description: 'Una idea creata durante i test',
          category: 'Test',
          status: 'pending',
          priority: 'medium',
          authorId: newUser.id,
          coupleId: couples[0]?.id || 'default-couple-id',
        },
      })

      // Crea una notifica correlata
      const notification = await tx.notification.create({
        data: {
          title: 'Nuova idea aggiunta',
          message: `${newUser.name} ha aggiunto una nuova idea: ${newIdea.title}`,
          type: 'idea',
          metadata: {
            ideaId: newIdea.id,
            authorName: newUser.name,
          },
          userId: couples[0]?.users[0]?.id || 'default-user-id',
        },
      })

      return { newIdea, notification }
    })
    console.log(`✅ Transazione completata: Idea "${result.newIdea.title}" e notifica creati`)

    // Test 8: Eliminazione dati di test (DELETE)
    console.log('\n🗑️ Test 8: Pulizia dati di test')
    
    // Elimina la memoria di test
    await prisma.memory.delete({
      where: { id: newMemory.id },
    })
    console.log('✅ Memoria di test eliminata')

    // Elimina l'idea di test
    await prisma.ideas.delete({
      where: { id: result.newIdea.id },
    })
    console.log('✅ Idea di test eliminata')

    // Elimina la notifica di test
    await prisma.notification.delete({
      where: { id: result.notification.id },
    })
    console.log('✅ Notifica di test eliminata')

    // Elimina l'utente di test
    await prisma.user.delete({
      where: { id: newUser.id },
    })
    console.log('✅ Utente di test eliminato')

    console.log('\n🎉 Tutti i test delle interazioni database completati con successo!')
    console.log('\n📋 Riepilogo test:')
    console.log('✅ CREATE: Nuovi record creati correttamente')
    console.log('✅ READ: Query e relazioni funzionanti')
    console.log('✅ UPDATE: Aggiornamenti funzionanti')
    console.log('✅ DELETE: Eliminazioni funzionanti')
    console.log('✅ RELATIONS: Relazioni tra modelli funzionanti')
    console.log('✅ TRANSACTIONS: Transazioni funzionanti')
    console.log('✅ AGGREGATIONS: Query di aggregazione funzionanti')

  } catch (error) {
    console.error('❌ Errore durante i test:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Esegui i test
testDatabaseInteractions()
  .catch((error) => {
    console.error('❌ Test falliti:', error)
    process.exit(1)
  }) 