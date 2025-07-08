'use client';

import { Button } from '@/components/ui/button';
import { PlusCircle, Gift, Camera, Star } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

export const FirstMemoryGuide = () => {
  return (
    <div className="text-center bg-white/50 backdrop-blur-xl rounded-3xl p-8 md:p-12 shadow-lg border border-white/30 max-w-2xl mx-auto my-12">
      <div className="flex items-center justify-center mb-6">
        <Gift className="w-16 h-16 text-pink-500 animate-bounce" />
      </div>
      <h2 className="text-3xl font-bold text-gray-800 mb-4">
        È ora di creare il vostro primo ricordo!
      </h2>
      <p className="text-lg text-gray-600 mb-8 max-w-prose mx-auto">
        La vostra storia è unica. Iniziate a catturare i momenti che la rendono speciale.
        Caricate una foto, raccontate una storia, e rivivete le vostre emozioni.
      </p>
      
      <Link href="/memories/create" passHref>
        <Button size="lg">
          <PlusCircle className="mr-2 h-5 w-5" />
          Crea il tuo primo ricordo
        </Button>
      </Link>

      <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          <div className="flex items-start space-x-3">
              <Camera className="w-6 h-6 text-blue-500 mt-1 flex-shrink-0" />
              <div>
                  <h4 className="font-semibold text-gray-700">Aggiungi Foto</h4>
                  <p className="text-sm text-gray-500">Dai vita ai tuoi ricordi con le immagini più belle.</p>
              </div>
          </div>
          <div className="flex items-start space-x-3">
              <Star className="w-6 h-6 text-yellow-500 mt-1 flex-shrink-0" />
              <div>
                  <h4 className="font-semibold text-gray-700">Scegli un Mood</h4>
                  <p className="text-sm text-gray-500">Associa un'emozione a ogni momento per non dimenticarla mai.</p>
              </div>
          </div>
          <div className="flex items-start space-x-3">
              <PlusCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
              <div>
                  <h4 className="font-semibold text-gray-700">Collega Idee</h4>
                  <p className="text-sm text-gray-500">Trasforma le tue idee per appuntamenti in ricordi concreti.</p>
              </div>
          </div>
      </div>
    </div>
  );
}; 