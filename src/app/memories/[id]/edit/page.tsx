'use client';

import { useState, useEffect } from 'react';
import { useRouter, notFound } from 'next/navigation';
import { getMemoryById } from '@/lib/api';
import { Memory } from '@/types/memory';
import MemoryForm from '@/components/MemoryForm';
import { toast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { Trash2 } from 'lucide-react';

interface MemoryFormData {
    title: string;
    description?: string;
    date: Date;
    location?: string;
    mood?: string;
    spotifyTrack?: any;
}

export default function EditMemoryPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [memory, setMemory] = useState<Memory | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isConfirmOpen, setConfirmOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchMemory() {
            try {
                setLoading(true);
                const fetchedMemory = await getMemoryById(params.id);
                if (!fetchedMemory) {
                    notFound();
                    return;
                }
                setMemory(fetchedMemory);
            } catch (err) {
                setError('Failed to load memory data.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        fetchMemory();
    }, [params.id]);
    
    const handleFormSubmit = async (data: MemoryFormData) => {
        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/memories/${params.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Impossibile aggiornare il ricordo.");
            }

            toast({
                title: 'Successo!',
                description: 'Ricordo aggiornato con successo.',
            });
            router.push(`/memories/${params.id}`);
            router.refresh();
        } catch (err) {
            console.error(err);
            toast({
                title: 'Errore',
                description: err instanceof Error ? err.message : "Si è verificato un errore.",
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        setConfirmOpen(false);
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/memories/${params.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                 const errorData = await response.json();
                throw new Error(errorData.error || "Impossibile eliminare il ricordo.");
            }

            toast({
                title: 'Ricordo eliminato',
                description: 'Il ricordo è stato eliminato con successo.',
            });
            router.push('/timeline'); // Reindirizza alla timeline
            router.refresh();
        } catch (err) {
            console.error(err);
            toast({
                title: 'Errore',
                description: err instanceof Error ? err.message : "Si è verificato un errore.",
                variant: 'destructive',
            });
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto p-4 max-w-2xl">
                <Skeleton className="h-10 w-1/3 mb-6" />
                <div className="space-y-6">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>
        );
    }
    
    if (error) {
        return <div className="text-center text-red-500 py-10">{error}</div>;
    }

    if (!memory) {
        return notFound();
    }

    return (
        <>
            <div className="container mx-auto p-4">
                 <MemoryForm
                    initialData={{
                        ...memory,
                        // Il campo spotifyTrack potrebbe aver bisogno di una trasformazione se il formato non è lo stesso
                        spotifyTrack: memory.spotifyTrack || undefined, 
                    }}
                    onSubmit={handleFormSubmit}
                    onCancel={() => router.push(`/memories/${params.id}`)}
                    isLoading={isSubmitting}
                />
                <div className="mt-8 pt-8 border-t border-destructive/20">
                    <h3 className="text-lg font-semibold text-destructive mb-4">Zona Pericolo</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        L'eliminazione di un ricordo è un'azione permanente e non può essere annullata.
                    </p>
                    <Button 
                        variant="destructive" 
                        onClick={() => setConfirmOpen(true)}
                        disabled={isSubmitting || isDeleting}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {isDeleting ? 'Eliminazione...' : 'Elimina Ricordo'}
                    </Button>
                </div>
            </div>
            
            <ConfirmationDialog
                isOpen={isConfirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleDelete}
                title="Sei assolutamente sicuro?"
                description="Questa azione non può essere annullata. Questo eliminerà permanentemente il ricordo."
                confirmText="Sì, elimina"
            />
        </>
    );
} 