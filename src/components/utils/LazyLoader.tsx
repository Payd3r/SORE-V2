'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';

interface LazyLoaderProps {
  // Il percorso del componente da caricare, relativo alla cartella `src`
  componentPath: string;
  // Un componente da mostrare durante il caricamento
  fallback?: React.ReactNode;
  // Eventuali props da passare al componente caricato
  [key: string]: any;
}

const DefaultFallback = () => (
  <div className="flex items-center justify-center w-full h-full min-h-[200px]">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
  </div>
);

export default function LazyLoader({ 
  componentPath, 
  fallback = <DefaultFallback />, 
  ...props 
}: LazyLoaderProps) {
  
  const LazyComponent = dynamic(() => import(`@/${componentPath}`), {
    ssr: false, // Disabilita il rendering lato server se non necessario
    loading: () => fallback as React.ReactElement,
  });

  return (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
} 