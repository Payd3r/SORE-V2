'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link2, Unlink, Calendar, MapPin, Heart, Users, Plus, X } from 'lucide-react';

interface Memory {
  id: string;
  title: string;
  description?: string;
  date: string;
  location?: string;
  category?: string;
  mood?: string;
  images: Array<{
    id: string;
    filename: string;
    thumbnailPath?: string;
  }>;
  author: {
    id: string;
    name: string;
    email: string;
  };
}

interface Idea {
  id: string;
  title: string;
  description?: string;
  category?: string;
  status: string;
  priority: string;
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface IdeaMemoryLinkProps {
  idea: Idea;
  linkedMemory?: Memory;
  onLinkMemory?: (ideaId: string, memoryId: string) => void;
  onUnlinkMemory?: (ideaId: string) => void;
  availableMemories?: Memory[];
  isEditable?: boolean;
}

const statusColors = {
  pending: 'bg-yellow-500',
  'in-progress': 'bg-blue-500',
  completed: 'bg-green-500',
  cancelled: 'bg-red-500',
};

const priorityColors = {
  low: 'bg-gray-500',
  medium: 'bg-orange-500',
  high: 'bg-red-500',
};

export function IdeaMemoryLink({
  idea,
  linkedMemory,
  onLinkMemory,
  onUnlinkMemory,
  availableMemories = [],
  isEditable = false,
}: IdeaMemoryLinkProps) {
  const [showMemorySelector, setShowMemorySelector] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLinkMemory = async (memoryId: string) => {
    if (!onLinkMemory) return;
    
    setLoading(true);
    try {
      await onLinkMemory(idea.id, memoryId);
      setShowMemorySelector(false);
    } catch (error) {
      console.error('Errore nel collegamento della memoria:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkMemory = async () => {
    if (!onUnlinkMemory) return;

    setLoading(true);
    try {
      await onUnlinkMemory(idea.id);
    } catch (error) {
      console.error('Errore nella rimozione del collegamento:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{idea.title}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge 
              className={`text-white ${statusColors[idea.status as keyof typeof statusColors]}`}
            >
              {idea.status}
            </Badge>
            <Badge 
              className={`text-white ${priorityColors[idea.priority as keyof typeof priorityColors]}`}
            >
              {idea.priority}
            </Badge>
          </div>
        </div>
        {idea.description && (
          <p className="text-sm text-gray-600 mt-2">{idea.description}</p>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Memory Link Section */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Memoria Collegata
              </h4>
              {isEditable && (
                <div className="flex items-center gap-2">
                  {linkedMemory ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleUnlinkMemory}
                      disabled={loading}
                      className="flex items-center gap-1"
                    >
                      <Unlink className="w-3 h-3" />
                      Scollega
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowMemorySelector(true)}
                      disabled={loading}
                      className="flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Collega Memoria
                    </Button>
                  )}
                </div>
              )}
            </div>

            {linkedMemory ? (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900">{linkedMemory.title}</h5>
                    {linkedMemory.description && (
                      <p className="text-sm text-gray-600 mt-1">{linkedMemory.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(linkedMemory.date)}
                      </div>
                      
                      {linkedMemory.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {linkedMemory.location}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {linkedMemory.author.name}
                      </div>
                    </div>

                    {linkedMemory.category && (
                      <Badge variant="secondary" className="mt-2">
                        {linkedMemory.category}
                      </Badge>
                    )}
                  </div>
                  
                  {linkedMemory.images && linkedMemory.images.length > 0 && (
                    <div className="flex -space-x-2 ml-4">
                      {linkedMemory.images.slice(0, 3).map((image) => (
                        <div
                          key={image.id}
                          className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs"
                        >
                          📸
                        </div>
                      ))}
                      {linkedMemory.images.length > 3 && (
                        <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-300 flex items-center justify-center text-xs">
                          +{linkedMemory.images.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Link2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nessuna memoria collegata</p>
                <p className="text-xs mt-1">
                  Collega questa idea a una memoria per contestualizzarla meglio
                </p>
              </div>
            )}
          </div>

          {/* Memory Selector Modal */}
          {showMemorySelector && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Seleziona Memoria</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMemorySelector(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {availableMemories.map((memory) => (
                    <div
                      key={memory.id}
                      className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleLinkMemory(memory.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{memory.title}</h4>
                          {memory.description && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {memory.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            {formatDate(memory.date)}
                            {memory.location && (
                              <>
                                <MapPin className="w-3 h-3 ml-2" />
                                {memory.location}
                              </>
                            )}
                          </div>
                        </div>
                        {memory.images && memory.images.length > 0 && (
                          <div className="text-xs text-gray-500">
                            {memory.images.length} 📸
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {availableMemories.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">Nessuna memoria disponibile</p>
                      <p className="text-xs mt-1">
                        Crea alcune memorie per poterle collegare alle tue idee
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Idea Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-700">Categoria:</p>
              <p className="text-gray-600">{idea.category || 'Non specificata'}</p>
            </div>
            
            {idea.dueDate && (
              <div>
                <p className="font-medium text-gray-700">Scadenza:</p>
                <p className="text-gray-600">{formatDate(idea.dueDate)}</p>
              </div>
            )}
            
            <div>
              <p className="font-medium text-gray-700">Creata:</p>
              <p className="text-gray-600">{formatDate(idea.createdAt)}</p>
            </div>
            
            {idea.completedAt && (
              <div>
                <p className="font-medium text-gray-700">Completata:</p>
                <p className="text-gray-600">{formatDate(idea.completedAt)}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 