'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Camera, Lightbulb, Eye, EyeOff, Users } from 'lucide-react';

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
  author: {
    id: string;
    name: string;
    email: string;
  };
}

interface Memory {
  id: string;
  title: string;
  description?: string;
  date: string;
  location?: string;
  category?: string;
  mood?: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
}

interface MemoryIdeasViewProps {
  memory: Memory;
  ideas: Idea[];
  showLinkedIdeas?: boolean;
  onToggleIdeasVisibility?: () => void;
  isLoading?: boolean;
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

export function MemoryIdeasView({
  memory,
  ideas,
  showLinkedIdeas = true,
  onToggleIdeasVisibility,
  isLoading = false,
}: MemoryIdeasViewProps) {
  const [expandedIdeas, setExpandedIdeas] = useState<Set<string>>(new Set());

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const toggleIdeaExpansion = (ideaId: string) => {
    setExpandedIdeas(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ideaId)) {
        newSet.delete(ideaId);
      } else {
        newSet.add(ideaId);
      }
      return newSet;
    });
  };

  const getStatusText = (status: string) => {
    const statusMap = {
      pending: 'In attesa',
      'in-progress': 'In corso',
      completed: 'Completata',
      cancelled: 'Annullata',
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const getPriorityText = (priority: string) => {
    const priorityMap = {
      low: 'Bassa',
      medium: 'Media',
      high: 'Alta',
    };
    return priorityMap[priority as keyof typeof priorityMap] || priority;
  };

  // Group ideas by status
  const ideasByStatus = ideas.reduce((acc, idea) => {
    if (!acc[idea.status]) {
      acc[idea.status] = [];
    }
    acc[idea.status].push(idea);
    return acc;
  }, {} as Record<string, Idea[]>);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl">{memory.title}</CardTitle>
            {memory.description && (
              <p className="text-gray-600 mt-2">{memory.description}</p>
            )}
            
            <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(memory.date)}
              </div>
              
              {memory.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {memory.location}
                </div>
              )}
              
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {memory.author.name}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3">
              {memory.category && (
                <Badge variant="secondary">{memory.category}</Badge>
              )}
              {memory.mood && (
                <Badge variant="outline">😊 {memory.mood}</Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-gray-400" />
            {onToggleIdeasVisibility && (
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleIdeasVisibility}
                className="flex items-center gap-1"
              >
                {showLinkedIdeas ? (
                  <>
                    <EyeOff className="w-4 h-4" />
                    Nascondi Idee
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    Mostra Idee
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      {showLinkedIdeas && (
        <CardContent>
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Idee Collegate ({ideas.length})
              </h3>
              
              {ideas.length > 0 && (
                <div className="text-sm text-gray-500">
                  {Object.keys(ideasByStatus).length} stati diversi
                </div>
              )}
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-500 mt-2">Caricamento idee...</p>
              </div>
            ) : ideas.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nessuna idea collegata a questa memoria</p>
                <p className="text-xs mt-1">
                  Le idee collegate ti aiutano a pianificare attività future basate su questa memoria
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(ideasByStatus).map(([status, statusIdeas]) => (
                  <div key={status} className="space-y-2">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge 
                        className={`text-white ${statusColors[status as keyof typeof statusColors]}`}
                      >
                        {getStatusText(status)}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {statusIdeas.length} idea{statusIdeas.length !== 1 ? 'e' : ''}
                      </span>
                    </div>
                    
                    <div className="grid gap-3">
                      {statusIdeas.map((idea) => (
                        <div
                          key={idea.id}
                          className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium text-gray-900">{idea.title}</h4>
                                <Badge 
                                  className={`text-white text-xs ${priorityColors[idea.priority as keyof typeof priorityColors]}`}
                                >
                                  {getPriorityText(idea.priority)}
                                </Badge>
                              </div>
                              
                              {expandedIdeas.has(idea.id) && idea.description && (
                                <p className="text-sm text-gray-600 mb-3">{idea.description}</p>
                              )}
                              
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  Creata: {formatDate(idea.createdAt)}
                                </div>
                                
                                {idea.dueDate && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    Scadenza: {formatDate(idea.dueDate)}
                                  </div>
                                )}
                                
                                <div className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {idea.author.name}
                                </div>
                              </div>
                              
                              {idea.category && (
                                <Badge variant="outline" className="mt-2 text-xs">
                                  {idea.category}
                                </Badge>
                              )}
                            </div>
                            
                            {idea.description && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleIdeaExpansion(idea.id)}
                                className="ml-2 text-gray-400 hover:text-gray-600"
                              >
                                {expandedIdeas.has(idea.id) ? '−' : '+'}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
} 