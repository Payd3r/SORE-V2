'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from "@/components/ui/use-toast";

interface GenerateJourneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJourneyGenerated: (journey: any) => void;
}

export default function GenerateJourneyModal({ isOpen, onClose, onJourneyGenerated }: GenerateJourneyModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!startDate || !endDate) {
        setError('Le date di inizio e fine sono obbligatorie.');
        setIsSubmitting(false);
        return;
    }

    try {
      const response = await fetch('/api/journeys/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            title, 
            description, 
            startDate: new Date(startDate).toISOString(),
            endDate: new Date(endDate).toISOString() 
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Errore durante la generazione del viaggio.');
      }

      onJourneyGenerated(data);
      toast({
          title: "Successo!",
          description: "Viaggio generato con successo."
      });
      onClose();

    } catch (err: any) {
      setError(err.message);
      toast({
          title: "Errore",
          description: err.message,
          variant: "destructive",
      })
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">Genera un Nuovo Viaggio</h2>
        <p className="text-sm text-gray-500 mb-4">Seleziona un periodo e genereremo automaticamente un viaggio con tutti i ricordi geolocalizzati che avete creato.</p>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Titolo del Viaggio</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="description">Descrizione (opzionale)</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="startDate">Data Inizio</Label>
                    <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
                </div>
                <div>
                    <Label htmlFor="endDate">Data Fine</Label>
                    <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
                </div>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

          <div className="flex justify-end space-x-4 mt-6">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Annulla</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Generazione...' : 'Genera Viaggio'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 