import PusherClient from 'pusher-js';

// Funzione per inizializzare il client Pusher solo nel browser
const getPusherClient = () => {
  // Controlla se il codice sta girando nel browser prima di inizializzare
  if (typeof window !== 'undefined') {
    // Abilita il logging solo in sviluppo
    if (process.env.NODE_ENV === 'development') {
      PusherClient.logToConsole = true;
    }
    
    return new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: '/api/pusher/auth',
      auth: {
        headers: {
            'Content-Type': 'application/json',
        }
      }
    });
  }
  return null;
}

export const pusherClient = getPusherClient(); 