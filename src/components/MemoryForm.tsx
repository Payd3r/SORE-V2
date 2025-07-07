'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import MoodSelector from '@/components/MoodSelector';
import SpotifySearchWidget from '@/components/SpotifySearchWidget';
import { useMoodSelection } from '@/hooks/useMoodSelection';
import { SpotifyTrack } from '@/types/memory';

interface MemoryFormProps {
  initialData?: {
    title?: string;
    description?: string;
    date?: Date;
    location?: string;
    mood?: string;
    spotifyTrack?: SpotifyTrack;
  };
  onSubmit: (data: MemoryFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

interface MemoryFormData {
  title: string;
  description?: string;
  date: Date;
  location?: string;
  mood?: string;
  spotifyTrack?: SpotifyTrack;
}

export default function MemoryForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: MemoryFormProps) {
  const [formData, setFormData] = useState<MemoryFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    date: initialData?.date || new Date(),
    location: initialData?.location || '',
    mood: initialData?.mood || undefined,
    spotifyTrack: initialData?.spotifyTrack || undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedSpotifyTrack, setSelectedSpotifyTrack] = useState<SpotifyTrack | null | undefined>(initialData?.spotifyTrack);

  const {
    selectedMood,
    selectedMoodData,
    handleMoodSelect,
    isLoading: moodLoading,
  } = useMoodSelection({
    initialMood: initialData?.mood,
    context: {
      time: formData.date,
      location: formData.location,
    },
  });

  const handleInputChange = (field: keyof MemoryFormData, value: string | Date) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Il titolo è obbligatorio';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Il titolo non può superare 200 caratteri';
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'La descrizione non può superare 1000 caratteri';
    }

    if (formData.location && formData.location.length > 100) {
      newErrors.location = 'La location non può superare 100 caratteri';
    }

    if (!formData.date) {
      newErrors.date = 'La data è obbligatoria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit({
        ...formData,
        mood: selectedMood,
        spotifyTrack: selectedSpotifyTrack || undefined,
      });
    } catch (error) {
      console.error('Errore nel salvataggio della memoria:', error);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {initialData ? 'Modifica Memoria' : 'Crea Nuova Memoria'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Titolo *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Inserisci il titolo della memoria..."
              disabled={isLoading}
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrizione</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Descrivi questa memoria..."
              rows={4}
              disabled={isLoading}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Data *</Label>
            <Input
              id="date"
              type="datetime-local"
              value={formData.date.toISOString().slice(0, 16)}
              onChange={(e) => handleInputChange('date', new Date(e.target.value))}
              disabled={isLoading}
              className={errors.date ? 'border-red-500' : ''}
            />
            {errors.date && (
              <p className="text-sm text-red-600">{errors.date}</p>
            )}
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Luogo</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="Dove è avvenuta questa memoria?"
              disabled={isLoading}
              className={errors.location ? 'border-red-500' : ''}
            />
            {errors.location && (
              <p className="text-sm text-red-600">{errors.location}</p>
            )}
          </div>

          {/* Mood Selection */}
          <div className="space-y-2">
            <Label>Stato d'animo</Label>
            <MoodSelector
              selectedMood={selectedMood}
              onMoodSelect={handleMoodSelect}
              variant="compact"
              showSuggestions={true}
              context={{
                time: formData.date,
                location: formData.location,
              }}
              disabled={isLoading || moodLoading}
            />
            {selectedMoodData && (
              <p className="text-sm text-gray-600">
                Selezionato: {selectedMoodData.emoji} {selectedMoodData.nameIt}
              </p>
            )}
          </div>

          {/* Spotify Integration */}
          <div className="space-y-2">
            <SpotifySearchWidget
              selectedTrack={selectedSpotifyTrack}
              onTrackSelect={setSelectedSpotifyTrack}
              disabled={isLoading}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading || moodLoading}
              className="flex-1"
            >
              {isLoading ? 'Salvando...' : (initialData ? 'Aggiorna' : 'Crea Memoria')}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Annulla
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 