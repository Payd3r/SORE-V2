'use client';

import React, { useState, useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useSession } from 'next-auth/react';

interface UploadProgress {
  fileId: string;
  filename: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  message?: string;
}

export default function UploadProgress() {
  const { data: session } = useSession();
  const clientId = session?.user?.id;
  const { lastMessage } = useWebSocket<{
    type: string;
    fileId: string;
    filename: string;
    progress: number;
    status: 'uploading' | 'processing' | 'completed' | 'failed';
    message?: string;
  }>(clientId || '');

  const [uploads, setUploads] = useState<Record<string, UploadProgress>>({});

  useEffect(() => {
    if (lastMessage && (lastMessage.type === 'upload_progress' || lastMessage.type === 'processing_progress')) {
      setUploads((prevUploads) => ({
        ...prevUploads,
        [lastMessage.fileId]: {
          fileId: lastMessage.fileId,
          filename: lastMessage.filename,
          progress: lastMessage.progress,
          status: lastMessage.status,
          message: lastMessage.message,
        },
      }));

      // Remove completed or failed uploads after 5 seconds
      if (lastMessage.status === 'completed' || lastMessage.status === 'failed') {
        setTimeout(() => {
          setUploads((prev) => {
            const newUploads = { ...prev };
            delete newUploads[lastMessage.fileId];
            return newUploads;
          });
        }, 5000);
      }
    }
  }, [lastMessage]);

  const activeUploads = Object.values(uploads);

  if (activeUploads.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-gray-800 text-white p-4 rounded-lg shadow-lg z-50">
      <h3 className="text-lg font-bold mb-2">Uploads</h3>
      <ul>
        {activeUploads.map((upload) => (
          <li key={upload.fileId} className="mb-2">
            <p className="text-sm truncate">{upload.filename}</p>
            <div className="w-full bg-gray-600 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full ${
                  upload.status === 'failed' ? 'bg-red-500' : 'bg-blue-500'
                }`}
                style={{ width: `${upload.progress}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-400 mt-1">{upload.message}</p>
          </li>
        ))}
      </ul>
    </div>
  );
} 