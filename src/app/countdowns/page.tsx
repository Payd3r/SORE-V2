'use client';

import { useState, useEffect } from 'react';
import { Countdown } from '@prisma/client';
import CountdownList from '@/components/Countdown/CountdownList';
import CreateCountdownModal from '@/components/Countdown/CreateCountdownModal';
import { Button } from '@/components/ui/button';
import { useToast } from "@/components/ui/use-toast"

export default function CountdownsPage() {
  const [countdowns, setCountdowns] = useState<Countdown[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCountdown, setEditingCountdown] = useState<Countdown | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchCountdowns() {
      try {
        const response = await fetch('/api/countdowns');
        if (!response.ok) {
          throw new Error('Errore nel caricamento dei dati');
        }
        const data = await response.json();
        setCountdowns(data);
      } catch (err: any) {
        setError(err.message);
        toast({
          title: "Errore",
          description: "Impossibile caricare i conti alla rovescia.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false);
      }
    }
    fetchCountdowns();
  }, [toast]);

  const handleCreateOrUpdate = (countdown: Countdown) => {
    if (editingCountdown) {
      setCountdowns(countdowns.map((c) => (c.id === countdown.id ? countdown : c)));
    } else {
      setCountdowns([...countdowns, countdown]);
    }
    setEditingCountdown(null);
  };

  const handleEdit = (countdown: Countdown) => {
    setEditingCountdown(countdown);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo conto alla rovescia?')) {
        return;
    }
    
    try {
      const response = await fetch(`/api/countdowns/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Errore durante l\'eliminazione');
      }
      setCountdowns(countdowns.filter((c) => c.id !== id));
      toast({
        title: "Successo",
        description: "Conto alla rovescia eliminato.",
      })
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Errore",
        description: "Impossibile eliminare il conto alla rovescia.",
        variant: "destructive",
      })
    }
  };

  const openCreateModal = () => {
    setEditingCountdown(null);
    setIsModalOpen(true);
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Conti alla Rovescia</h1>
        <Button onClick={openCreateModal}>Nuovo Conto alla Rovescia</Button>
      </div>

      {isLoading && <p>Caricamento...</p>}
      {error && <p className="text-red-500">{error}</p>}
      
      {!isLoading && !error && (
        <CountdownList
          countdowns={countdowns}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {(isModalOpen || editingCountdown) && (
        <CreateCountdownModal
          isOpen={isModalOpen || !!editingCountdown}
          onClose={() => {
            setIsModalOpen(false)
            setEditingCountdown(null)
          }}
          onCountdownCreated={handleCreateOrUpdate}
          existingCountdown={editingCountdown}
        />
      )}
    </div>
  );
} 