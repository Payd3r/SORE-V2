'use client';

import React, { useState } from 'react';
import { Camera, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CameraAccess from './CameraAccess';

export default function CameraTest() {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [aspectRatio, setAspectRatio] = useState<'square' | 'landscape' | 'portrait'>('square');

  const handleCapture = (imageData: string) => {
    setCapturedImages(prev => [imageData, ...prev]);
    setIsCameraOpen(false);
  };

  const clearImages = () => {
    setCapturedImages([]);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-6 w-6" />
            Test Fotocamera PWA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Controlli */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Fotocamera
              </label>
              <select
                value={facingMode}
                onChange={(e) => setFacingMode(e.target.value as 'user' | 'environment')}
                className="w-full p-2 border rounded-md"
              >
                <option value="environment">Posteriore</option>
                <option value="user">Frontale</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Formato
              </label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as 'square' | 'landscape' | 'portrait')}
                className="w-full p-2 border rounded-md"
              >
                <option value="square">Quadrato (1:1)</option>
                <option value="landscape">Orizzontale (16:9)</option>
                <option value="portrait">Verticale (9:16)</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={() => setIsCameraOpen(true)}
                className="w-full"
              >
                <Camera className="h-4 w-4 mr-2" />
                Apri Fotocamera
              </Button>
            </div>
          </div>

          {/* Statistiche */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {capturedImages.length}
                </div>
                <div className="text-sm text-gray-600">
                  Foto Catturate
                </div>
              </div>
              <div>
                <Button
                  onClick={clearImages}
                  variant="outline"
                  size="sm"
                  disabled={capturedImages.length === 0}
                >
                  Cancella Tutto
                </Button>
              </div>
            </div>
          </div>

          {/* Galleria foto catturate */}
          {capturedImages.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Foto Catturate
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {capturedImages.map((image, index) => (
                  <div
                    key={index}
                    className="relative group bg-gray-100 rounded-lg overflow-hidden aspect-square"
                  >
                    <img
                      src={image}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors">
                      <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        #{index + 1}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Informazioni tecniche */}
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>User Agent:</strong> {navigator.userAgent.includes('iPhone') ? 'iPhone' : 'Altro dispositivo'}</p>
            <p><strong>Supporto getUserMedia:</strong> {navigator.mediaDevices ? '✅ Sì' : '❌ No'}</p>
            <p><strong>Supporto Screen Orientation:</strong> {screen.orientation ? '✅ Sì' : '❌ No'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Componente fotocamera */}
      <CameraAccess
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCapture}
        facingMode={facingMode}
        aspectRatio={aspectRatio}
      />
    </div>
  );
} 