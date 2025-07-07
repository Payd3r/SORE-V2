'use client';

import { useState, useEffect } from 'react';

type PartnerStatus = 'disconnected' | 'connecting' | 'connected' | 'capturing' | 'captured' | 'error';

interface PartnerSyncState {
  status: PartnerStatus;
  progress?: number;
}

export function usePartnerSync(momentId: string) {
  const [partnerState, setPartnerState] = useState<PartnerSyncState>({ status: 'disconnected' });

  useEffect(() => {
    // Simulate connection
    setPartnerState({ status: 'connecting' });
    const connectTimeout = setTimeout(() => {
      setPartnerState({ status: 'connected' });
    }, 2000);

    // Simulate partner capturing
    const captureTimeout = setTimeout(() => {
      setPartnerState({ status: 'capturing' });
    }, 4000);
    
    // Simulate partner captured
    const capturedTimeout = setTimeout(() => {
        setPartnerState({ status: 'captured', progress: 100 });
    }, 6000);


    return () => {
      clearTimeout(connectTimeout);
      clearTimeout(captureTimeout);
      clearTimeout(capturedTimeout);
    };
  }, [momentId]);

  return partnerState;
} 