'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/components/ui/use-toast";
import { QRCodeCanvas } from 'qrcode.react';
import { Copy, X } from 'lucide-react';

interface ShareMemoryModalProps {
  memoryId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface ShareStatus {
    isShared: boolean;
    token?: string;
    expiresAt?: string | null;
    hasPassword?: boolean;
}

export default function ShareMemoryModal({ memoryId, isOpen, onClose }: ShareMemoryModalProps) {
    const [status, setStatus] = useState<ShareStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [password, setPassword] = useState('');
    const [expiresInDays, setExpiresInDays] = useState<number | undefined>(7);
    const { toast } = useToast();

    const shareUrl = status?.token ? `${window.location.origin}/share/${status.token}` : '';

    useEffect(() => {
        if (isOpen && memoryId) {
            fetchShareStatus();
        }
    }, [isOpen, memoryId]);

    const fetchShareStatus = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/memories/${memoryId}/share`);
            if (!response.ok) throw new Error('Failed to fetch sharing status');
            const data = await response.json();
            setStatus(data);
        } catch (error) {
            toast({ title: 'Error', description: 'Could not fetch sharing details.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateOrUpdate = async () => {
        try {
            const response = await fetch(`/api/memories/${memoryId}/share`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    password: password || undefined,
                    expiresInDays: expiresInDays || undefined,
                })
            });
            if (!response.ok) throw new Error('Failed to create/update share link');
            toast({ title: 'Success', description: 'Share link has been created/updated.' });
            fetchShareStatus(); // Refresh status
            setPassword(''); // Clear password field
        } catch (error) {
            toast({ title: 'Error', description: 'Could not update share settings.', variant: 'destructive' });
        }
    };

    const handleRevoke = async () => {
        try {
            const response = await fetch(`/api/memories/${memoryId}/share`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to revoke share link');
            toast({ title: 'Success', description: 'Sharing has been revoked.' });
            setStatus({ isShared: false }); // Update UI immediately
        } catch (error) {
            toast({ title: 'Error', description: 'Could not revoke sharing.', variant: 'destructive' });
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareUrl);
        toast({ title: 'Copiato!', description: 'Link copiato negli appunti.' });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-2xl w-full max-w-lg relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
                    <X size={24} />
                </button>
                <h2 className="text-2xl font-bold mb-4">Condividi Ricordo</h2>
                {isLoading ? (
                    <p>Caricamento...</p>
                ) : !status?.isShared ? (
                    <div>
                        <p className="mb-4">Questo ricordo non è attualmente condiviso. Genera un link per condividerlo.</p>
                        <Button onClick={handleGenerateOrUpdate}>Genera Link di Condivisione</Button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="flex-grow">
                                <Label htmlFor="share-url">Link di Condivisione</Label>
                                <div className="flex items-center">
                                    <Input id="share-url" type="text" value={shareUrl} readOnly className="pr-10" />
                                    <Button size="icon" variant="ghost" onClick={copyToClipboard} className="-ml-10">
                                        <Copy size={16} />
                                    </Button>
                                </div>
                                {status.expiresAt && <p className="text-xs text-gray-500 mt-1">Scade il: {new Date(status.expiresAt).toLocaleString()}</p>}
                            </div>
                            <div className="flex-shrink-0">
                                <QRCodeCanvas value={shareUrl} size={128} />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Opzioni</h3>
                            <div className="space-y-4 p-4 border rounded-md">
                                <div>
                                    <Label htmlFor="password">Password (opzionale)</Label>
                                    <Input id="password" type="password" placeholder={status.hasPassword ? 'Password impostata' : 'Nessuna password'} value={password} onChange={e => setPassword(e.target.value)} />
                                </div>
                                <div>
                                    <Label htmlFor="expires">Scadenza (giorni, opzionale)</Label>
                                    <Input id="expires" type="number" placeholder="Default: 7 giorni" value={expiresInDays} onChange={e => setExpiresInDays(parseInt(e.target.value))} />
                                </div>
                                <Button onClick={handleGenerateOrUpdate}>Aggiorna Link</Button>
                            </div>
                        </div>
                        <div className="pt-4 border-t flex justify-between items-center">
                             <Button variant="destructive" onClick={handleRevoke}>Revoca Condivisione</Button>
                             <a href={`/api/memories/${memoryId}/export/pdf`} download>
                                <Button variant="outline">Esporta in PDF</Button>
                             </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 