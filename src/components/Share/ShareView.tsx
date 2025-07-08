'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/components/ui/use-toast";

// Simplified types for the shared view
// These should ideally be more robust and defined in a central types file
type SharedMemory = {
  title: string;
  description: string | null;
  date: string;
  images: { path: string }[];
  videos: any[]; // Define more specifically if needed
  author: { name: string | null };
};
type SharedLink = {
  token: string;
  password?: string | null;
  memory: SharedMemory;
};

interface ShareViewProps {
  sharedLink: SharedLink;
}

export default function ShareView({ sharedLink }: ShareViewProps) {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(!sharedLink.password);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setError(null);

    try {
        const response = await fetch('/api/share/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: sharedLink.token, password }),
        });

        if (!response.ok) {
            throw new Error('La password inserita non è corretta.');
        }

        setIsAuthenticated(true);
        toast({ title: "Accesso autorizzato!" });

    } catch (err: any) {
        setError(err.message);
        toast({ title: "Errore", description: err.message, variant: "destructive" });
    } finally {
        setIsVerifying(false);
    }
  };

  if (!isAuthenticated) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-sm">
                <h2 className="text-2xl font-bold text-center mb-4">Ricordo Protetto</h2>
                <p className="text-center text-gray-600 mb-6">Questo ricordo è protetto da password. Inseriscila per continuare.</p>
                <form onSubmit={handlePasswordSubmit}>
                    <Input 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        required
                        className="mb-4"
                    />
                    {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                    <Button type="submit" className="w-full" disabled={isVerifying}>
                        {isVerifying ? 'Verifica in corso...' : 'Sblocca Ricordo'}
                    </Button>
                </form>
            </div>
        </div>
    );
  }

  // Render the actual memory content
  return (
    <div className="container mx-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-2">{sharedLink.memory.title}</h1>
            <p className="text-gray-500 mb-4">
                Un ricordo di {sharedLink.memory.author.name || 'Utente'} il {new Date(sharedLink.memory.date).toLocaleDateString()}
            </p>
            {sharedLink.memory.description && (
                <p className="text-lg mb-8">{sharedLink.memory.description}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sharedLink.memory.images.map(image => (
                    <div key={image.path} className="relative aspect-square">
                        <Image
                            src={`/${image.path}`} // Assuming images are served from the public root
                            alt={sharedLink.memory.title}
                            layout="fill"
                            objectFit="cover"
                            className="rounded-lg"
                        />
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
} 