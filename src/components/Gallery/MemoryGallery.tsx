'use client';

import React, { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Image as ImageIcon, List, MoreVertical, Star, Trash2, Heart, Share2, QrCode } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { PhotoThumbnail } from '@/components/ui/PhotoThumbnail';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Image } from '@/types/memory';

interface MemoryGalleryProps {
  memoryId: string;
  images: Image[];
}

const MemoryGallery: React.FC<MemoryGalleryProps> = ({ memoryId, images }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loadingImageId, setLoadingImageId] = useState<string | null>(null);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [sortBy, setSortBy] = useState('createdAt-desc');
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [optimisticFavorites, setOptimisticFavorites] = useState(new Set(images.filter(i => i.isFavorite).map(i => i.id)));
  const [qrCodeImage, setQrCodeImage] = useState<Image | null>(null);

  const displayedImages = useMemo(() => {
    let sortedAndFilteredImages = images.map(img => ({
        ...img,
        isFavorite: optimisticFavorites.has(img.id),
    }));

    if (filterFavorites) {
      sortedAndFilteredImages = sortedAndFilteredImages.filter(img => img.isFavorite);
    }

    switch (sortBy) {
      case 'createdAt-asc':
        sortedAndFilteredImages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        break;
      case 'createdAt-desc':
        sortedAndFilteredImages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
      case 'name-asc':
        sortedAndFilteredImages.sort((a, b) => a.originalName.localeCompare(b.originalName));
        break;
    }

    return sortedAndFilteredImages;
  }, [images, sortBy, filterFavorites, optimisticFavorites]);

  const handleSetCover = async (imageId: string) => {
    setLoadingImageId(imageId);
    try {
      const response = await fetch(`/api/images/${imageId}/set-cover`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to set cover image.');
      }

      toast({
        title: "Successo",
        description: "Immagine di copertina aggiornata.",
      });

      startTransition(() => {
        router.refresh();
      });

    } catch (error) {
      console.error(error);
      toast({
        title: "Errore",
        description: "Impossibile impostare l'immagine di copertina.",
        variant: "destructive",
      });
    } finally {
      setLoadingImageId(null);
    }
  };

  const handleDelete = async (imageId: string) => {
    setLoadingImageId(imageId);
    try {
        const response = await fetch(`/api/images/${imageId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Failed to delete image.');
        }

        toast({
            title: "Successo",
            description: "Immagine eliminata con successo.",
        });

        startTransition(() => {
            router.refresh();
        });

    } catch (error) {
        console.error(error);
        toast({
            title: "Errore",
            description: "Impossibile eliminare l'immagine.",
            variant: "destructive",
        });
    } finally {
        setLoadingImageId(null);
    }
  };

  const handleToggleFavorite = async (imageId: string) => {
    const originalFavorites = new Set(optimisticFavorites);
    setOptimisticFavorites(prev => {
        const newSet = new Set(prev);
        if (newSet.has(imageId)) {
            newSet.delete(imageId);
        } else {
            newSet.add(imageId);
        }
        return newSet;
    });

    try {
        const response = await fetch(`/api/images/${imageId}/favorite`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ isFavorite: !originalFavorites.has(imageId) }),
        });

        if (!response.ok) {
            throw new Error('Failed to toggle favorite status.');
        }
        // No need to refresh, optimistic update is enough
        toast({
            title: "Successo",
            description: "Stato preferito aggiornato.",
        });

    } catch (error) {
        console.error(error);
        // Revert optimistic update on error
        setOptimisticFavorites(originalFavorites);
        toast({
            title: "Errore",
            description: "Impossibile aggiornare lo stato preferito.",
            variant: "destructive",
        });
    }
  };
  
  const handleShare = async (image: Image) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Foto da SORE: ${image.originalName}`,
          text: `Guarda questa foto dal nostro ricordo condiviso!`,
          url: window.location.origin + image.path,
        });
        toast({
          title: "Condiviso!",
          description: "L'immagine è stata condivisa con successo.",
        });
      } catch (error) {
        console.error('Error sharing', error);
        toast({
          title: "Errore di condivisione",
          description: "Non è stato possibile condividere l'immagine.",
          variant: "destructive",
        });
      }
    } else {
      // Fallback per browser che non supportano l'API Web Share
      try {
        await navigator.clipboard.writeText(window.location.origin + image.path);
        toast({
            title: "Link copiato!",
            description: "Il link all'immagine è stato copiato negli appunti.",
        });
      } catch (err) {
          toast({
            title: "Errore",
            description: "Impossibile copiare il link.",
            variant: "destructive",
          });
      }
    }
  };

  const isLoading = isPending || loadingImageId !== null;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <Dialog>
      <div className="p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <h2 className="text-xl font-bold">Galleria ({displayedImages.length})</h2>
          <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                  <Label htmlFor="favorites-switch" className="flex items-center gap-2 cursor-pointer">
                      <Heart className="h-4 w-4" />
                      <span>Preferiti</span>
                  </Label>
                  <Switch
                      id="favorites-switch"
                      checked={filterFavorites}
                      onCheckedChange={setFilterFavorites}
                  />
              </div>
              <Select onValueChange={setSortBy} defaultValue={sortBy}>
                  <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Ordina per..." />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="createdAt-desc">Più recenti</SelectItem>
                      <SelectItem value="createdAt-asc">Meno recenti</SelectItem>
                      <SelectItem value="name-asc">Nome</SelectItem>
                  </SelectContent>
              </Select>
              <div>
                  <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('grid')}>
                      <ImageIcon className="h-4 w-4" />
                  </Button>
                  <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('list')}>
                      <List className="h-4 w-4" />
                  </Button>
              </div>
          </div>
        </div>

        {viewMode === 'grid' ? (
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {displayedImages.map((image) => (
              <motion.div key={image.id} className="relative group" variants={itemVariants}>
                <PhotoThumbnail
                  src={image.thumbnailPath || image.path}
                  alt={`Foto del ricordo`}
                  isCover={image.isCover}
                />
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                      variant="secondary" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => handleToggleFavorite(image.id)}
                      disabled={isLoading}
                  >
                      <Heart className={`h-4 w-4 ${image.isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="icon" className="h-8 w-8" disabled={isLoading}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem 
                        onClick={() => handleSetCover(image.id)}
                        disabled={isLoading && loadingImageId === image.id}
                      >
                        <Star className="mr-2 h-4 w-4" />
                        <span>Imposta come copertina</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleShare(image)}
                        disabled={isLoading}
                      >
                        <Share2 className="mr-2 h-4 w-4" />
                        <span>Condividi</span>
                      </DropdownMenuItem>
                      <DialogTrigger asChild>
                        <DropdownMenuItem onClick={() => setQrCodeImage(image)}>
                          <QrCode className="mr-2 h-4 w-4" />
                          <span>Genera QR Code</span>
                        </DropdownMenuItem>
                      </DialogTrigger>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(image.id)} 
                        className="text-red-600"
                        disabled={isLoading && loadingImageId === image.id}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Elimina</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            className="space-y-2"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {displayedImages.map((image) => (
              <motion.div 
                key={image.id} 
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                variants={itemVariants}
              >
                <div className="flex items-center gap-4">
                  <PhotoThumbnail
                    src={image.thumbnailPath || image.path}
                    alt={image.originalName}
                    isCover={image.isCover}
                    className="w-16 h-16 object-cover rounded-md"
                  />
                  <div>
                    <p className="font-semibold">{image.originalName}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(image.createdAt).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => handleToggleFavorite(image.id)}
                      disabled={isLoading}
                  >
                      <Heart className={`h-4 w-4 ${image.isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isLoading}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem 
                        onClick={() => handleSetCover(image.id)}
                        disabled={isLoading && loadingImageId === image.id}
                      >
                        <Star className="mr-2 h-4 w-4" />
                        <span>Imposta come copertina</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleShare(image)}
                        disabled={isLoading}
                      >
                        <Share2 className="mr-2 h-4 w-4" />
                        <span>Condividi</span>
                      </DropdownMenuItem>
                      <DialogTrigger asChild>
                        <DropdownMenuItem onClick={() => setQrCodeImage(image)}>
                          <QrCode className="mr-2 h-4 w-4" />
                          <span>Genera QR Code</span>
                        </DropdownMenuItem>
                      </DialogTrigger>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(image.id)} 
                        className="text-red-600"
                        disabled={isLoading && loadingImageId === image.id}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Elimina</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {qrCodeImage && (
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Condividi con QR Code</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-4">
            <QRCodeCanvas
              value={window.location.origin + qrCodeImage.path}
              size={256}
              level={"H"}
              includeMargin={true}
            />
            <p className="mt-4 text-sm text-muted-foreground text-center">
              Scansiona questo codice per vedere l'immagine.
            </p>
             <p className="mt-2 text-xs text-muted-foreground text-center">
              (Opzioni avanzate come link temporanei saranno disponibili a breve)
            </p>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
};

export default MemoryGallery; 