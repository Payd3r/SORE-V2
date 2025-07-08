'use client';

import React from 'react';
import { MomentManager } from '@/components/Moments/MomentManager';

export default function CaptureMomentPage() {
  // ID di un ricordo fittizio per il test.
  // In un'applicazione reale, questo verrebbe passato dalla pagina del ricordo.
  const FAKE_MEMORY_ID = 'clzkxx1230000abcdefgh1234'; 

  return (
    <div className="container mx-auto p-4 flex flex-col items-center">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Test Funzione "Momento"</h1>
        
        <p className="text-center text-gray-600 mb-8">
            Questo componente gestisce l'intero flusso di un "Momento". 
            Aprilo in due browser diversi per simulare i due partner.
        </p>

        <MomentManager memoryId={FAKE_MEMORY_ID} />

        <div className="mt-8 p-4 border-t">
            <h3 className="font-semibold">Come testare:</h3>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 mt-2">
                <li>Apri questa pagina in due browser o schede separate.</li>
                <li>Accedi con due utenti diversi della stessa coppia.</li>
                <li>In una scheda, clicca su "Avvia un Momento".</li>
                <li>Nell'altra scheda, dovresti vedere l'invito a partecipare.</li>
            </ul>
        </div>
      </div>
    </div>
  );
} 