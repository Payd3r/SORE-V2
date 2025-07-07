'use client';

import { useState, useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useSession } from 'next-auth/react';
import { addToSyncQueue } from '@/lib/indexed-db';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import CameraView from '@/components/momento/CameraView';
import MomentoStatus from '@/components/momento/MomentoStatus';

interface ServiceWorkerRegistrationWithSync extends ServiceWorkerRegistration {
  sync: {
    register(tag: string): Promise<void>;
    getTags(): Promise<string[]>;
  };
}

interface Message {
  type: string;
  message?: string;
  sender?: string;
  timestamp?: string;
  content?: any;
}

export default function MomentoPage() {
  const { data: session } = useSession();
  const clientId = session?.user?.id || 'anonymous';
  
  const { lastMessage, sendMessage, connectionStatus } = useWebSocket<Message>(clientId);
  const { subscribe, isSubscribed, error: pushError, isSupported: pushSupported } = usePushNotifications();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const isOnline = useOnlineStatus();
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  useEffect(() => {
    if (lastMessage) {
      setMessages((prevMessages) => [...prevMessages, lastMessage]);
    }
  }, [lastMessage]);

  const handleCapture = (blob: Blob) => {
    const imageUrl = URL.createObjectURL(blob);
    setCapturedImage(imageUrl);
    setIsCameraOpen(false);
    // Here you would typically upload the blob to a server
    // and then send a message via WebSocket
    sendMessage({ type: 'image_captured', content: `User ${clientId} captured an image.` });
  };

  const handleSend = async () => {
    if (input.trim()) {
      const messagePayload = { type: 'chat', content: input, sender: clientId };
      
      if (connectionStatus === 'open') {
        sendMessage(messagePayload);
      } else {
        // We are offline or WS is down, queue the message
        console.log('WebSocket not open. Queuing message for background sync.');
        try {
          await addToSyncQueue(messagePayload);
          // Register for a background sync
          if ('serviceWorker' in navigator && 'SyncManager' in window) {
            const registration = await navigator.serviceWorker.ready as ServiceWorkerRegistrationWithSync;
            await registration.sync.register('sync-momento-data');
            console.log('Background sync registered for "sync-momento-data"');
          }
        } catch (error) {
          console.error('Failed to queue message for sync:', error);
          // Optionally, show an error to the user
        }
      }

      // Add own message to the list immediately for better UX
      setMessages((prev) => [...prev, { ...messagePayload, sender: 'You', timestamp: new Date().toISOString() }]);
      setInput('');
    }
  };

  if (isCameraOpen) {
    return <CameraView onCapture={handleCapture} onCancel={() => setIsCameraOpen(false)} />;
  }

  return (
    <div className="flex flex-col h-screen p-4 bg-gray-900 text-white font-mono">
      <MomentoStatus lastMessage={lastMessage} />
      <h1 className="text-3xl font-bold mb-4 text-center text-purple-400">Momento</h1>
      <div className="mb-2 text-center">
        <button onClick={() => setIsCameraOpen(true)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mb-4">
            Avvia Momento Camera
        </button>
        <p>Network Status: <span className={`font-bold ${isOnline ? 'text-green-400' : 'text-red-400'}`}>{isOnline ? 'Online' : 'Offline'}</span></p>
        <p>Connection Status: <span className={`font-bold ${connectionStatus === 'open' ? 'text-green-400' : 'text-red-400'}`}>{connectionStatus}</span></p>
        <p>Your Client ID: <span className="text-yellow-400">{clientId}</span></p>
        {pushSupported && !isSubscribed && (
            <button 
                onClick={subscribe}
                className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
            >
                Enable Push Notifications
            </button>
        )}
        {isSubscribed && <p className="text-green-400">Push notifications enabled!</p>}
        {pushError && <p className="text-red-400">Push Error: {pushError.message}</p>}
      </div>
      {capturedImage && (
        <div className="mb-4 text-center">
            <h2 className="text-xl">Immagine Catturata:</h2>
            <img src={capturedImage} alt="Captured" className="max-w-xs mx-auto rounded-lg mt-2" />
        </div>
      )}
      <div className="flex-grow overflow-y-auto bg-gray-800 rounded-lg p-4 mb-4 border border-purple-500 shadow-lg">
        {messages.map((msg, index) => (
          <div key={index} className={`mb-2 ${msg.sender === 'You' ? 'text-right' : ''}`}>
            {msg.type === 'welcome' && (
              <p className="text-center text-gray-400 italic">-- {msg.message} --</p>
            )}
            {msg.type === 'chat' && (
               <div className={`inline-block p-2 rounded-lg ${msg.sender === 'You' ? 'bg-blue-600 ml-auto' : 'bg-gray-700'}`}>
                <span className="text-xs text-gray-400 block">{msg.sender === 'You' ? '' : msg.sender}</span>
                <p>{msg.content}</p>
                <span className="text-xs text-gray-500 block">{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ''}</span>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          className="flex-grow bg-gray-700 text-white p-2 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Type a message..."
        />
        <button
          onClick={handleSend}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-r-lg"
        >
          Send
        </button>
      </div>
    </div>
  );
} 