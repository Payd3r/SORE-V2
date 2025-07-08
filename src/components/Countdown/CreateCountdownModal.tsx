'use client';

import { useState, useEffect } from 'react';
import { Countdown } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from "@/components/ui/use-toast"

interface CreateCountdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCountdownCreated: (countdown: Countdown) => void;
  existingCountdown?: Countdown | null;
}

export default function CreateCountdownModal({ isOpen, onClose, onCountdownCreated, existingCountdown }: CreateCountdownModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (existingCountdown) {
      setTitle(existingCountdown.title);
      setDescription(existingCountdown.description || '');
      const eventDate = new Date(existingCountdown.date);
      setDate(eventDate.toISOString().split('T')[0]);
      setTime(eventDate.toTimeString().split(' ')[0].substring(0, 5));
    } else {
      // Reset form when opening for creation
      setTitle('');
      setDescription('');
      setDate('');
      setTime('');
    }
  }, [existingCountdown, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!date || !time) {
        setError('Data e ora sono obbligatorie.');
        setIsSubmitting(false);
        return;
    }

    const fullDateTime = new Date(`${date}T${time}:00`).toISOString();

    const body = {
        title,
        description,
        date: fullDateTime,
    };

    const url = existingCountdown ? `/api/countdowns/${existingCountdown.id}` : '/api/countdowns';
    const method = existingCountdown ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Errore durante ${existingCountdown ? 'la modifica' : 'la creazione'}`);
      }

      const newOrUpdatedCountdown = await response.json();
      onCountdownCreated(newOrUpdatedCountdown);
      toast({
          title: "Successo!",
          description: `Conto alla rovescia ${existingCountdown ? 'modificato' : 'creato'} con successo.`
      })
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
        <h2 className="text-2xl font-bold mb-6">{existingCountdown ? 'Modifica Conto alla Rovescia' : 'Crea Conto alla Rovescia'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Titolo</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="description">Descrizione (opzionale)</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="date">Data</Label>
                    <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>
                <div>
                    <Label htmlFor="time">Ora</Label>
                    <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
                </div>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

          <div className="flex justify-end space-x-4 mt-6">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Annulla</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvataggio...' : (existingCountdown ? 'Salva Modifiche' : 'Crea')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 