'use client'

import React, { useMemo, useState } from 'react';
import { PhotoThumbnail } from '@/components/ui/PhotoThumbnail';
import { Camera, Zap, FileImage, Eye, EyeOff, X, Clock, Video } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Image, Moment } from '@/types/memory';

// Definizione dei tipi di dati in input
interface MemoryHistoryTimelineProps {
  images: Image[];
  moments: Moment[];
}

type TimelineEvent = (Image & { type: 'image' }) | (Moment & { type: 'moment' });

// Funzione helper per raggruppare eventi per prossimità temporale
function groupTimelineEvents(events: TimelineEvent[]) {
    if (events.length === 0) return [];

    const sortedEvents = events.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const groups: { label: string; events: TimelineEvent[] }[] = [];
    let currentGroup: TimelineEvent[] = [];

    sortedEvents.forEach((event, index) => {
        if (index === 0) {
            currentGroup.push(event);
            return;
        }

        const prevEvent = sortedEvents[index - 1];
        const timeDiff = new Date(event.createdAt).getTime() - new Date(prevEvent.createdAt).getTime();
        const oneHour = 60 * 60 * 1000;

        if (timeDiff < oneHour) {
            currentGroup.push(event);
        } else {
            const groupDate = new Date(currentGroup[0].createdAt);
            groups.push({
                label: groupDate.toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
                events: currentGroup,
            });
            currentGroup = [event];
        }
    });

    // Aggiungi l'ultimo gruppo
    if (currentGroup.length > 0) {
         const groupDate = new Date(currentGroup[0].createdAt);
         groups.push({
            label: groupDate.toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            events: currentGroup,
        });
    }

    return groups.reverse(); // Mostra i più recenti prima
}


export function MemoryHistoryTimeline({ images, moments }: MemoryHistoryTimelineProps) {
  const [showImages, setShowImages] = useState(true);
  const [showMoments, setShowMoments] = useState(true);
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [selectedMoment, setSelectedMoment] = useState<Moment | null>(null);

  const timelineEvents = useMemo(() => {
    let combined: TimelineEvent[] = [];
    if (showImages) {
        combined.push(...images.map(img => ({ ...img, type: 'image' as const })));
    }
    if (showMoments) {
        combined.push(...moments.map(mom => ({ ...mom, type: 'moment' as const })));
    }
    return groupTimelineEvents(combined);
  }, [images, moments, showImages, showMoments]);

  if (timelineEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-10">
        <Camera className="w-12 h-12 mb-4" />
        <h3 className="text-lg font-semibold">Nessuna cronologia</h3>
        <p>Non ci sono eventi da mostrare.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full py-8">
      <div className="flex justify-end items-center gap-4 mb-4 pr-4 sm:pr-8 flex-wrap">
          <Label htmlFor="images-switch" className="flex items-center gap-2 cursor-pointer">
              <FileImage className="h-4 w-4" />
              <span>Immagini</span>
          </Label>
          <Switch
              id="images-switch"
              checked={showImages}
              onCheckedChange={setShowImages}
          />
          <Label htmlFor="moments-switch" className="flex items-center gap-2 cursor-pointer">
              <Zap className="h-4 w-4" />
              <span>Momenti</span>
          </Label>
          <Switch
              id="moments-switch"
              checked={showMoments}
              onCheckedChange={setShowMoments}
          />
      </div>
      <AnimatePresence>
        {timelineEvents.map((group, groupIndex) => (
          <motion.div
            key={group.label}
            className="relative pl-4 sm:pl-8 pb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: groupIndex * 0.1 }}
          >
            {/* Linea verticale della timeline */}
            <div className="absolute top-5 left-[9px] sm:left-[19px] w-0.5 h-full bg-border -z-10" />
            
            {/* Punto sulla timeline */}
            <div className="absolute top-5 left-[-6px] sm:left-0 w-10 h-10 flex items-center justify-center">
              <div className="h-4 w-4 rounded-full bg-primary ring-4 ring-primary/20" />
            </div>

            <div className="pl-4 sm:pl-8">
              <h3 className="text-lg font-semibold text-foreground mb-4">{group.label}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {group.events.map((event, eventIndex) => (
                  <motion.div
                    key={event.id}
                    className="cursor-pointer relative group"
                    onClick={() => event.type === 'image' ? setSelectedImage(event) : setSelectedMoment(event)}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: (groupIndex * 0.1) + (eventIndex * 0.05) }}
                  >
                    {event.type === 'image' && (
                       <>
                         <PhotoThumbnail
                           src={event.thumbnailPath || event.path}
                           alt={`Foto del ricordo ${event.id}`}
                         />
                         {event.isLivePhoto && (
                            <div className="absolute top-1 left-1 bg-black bg-opacity-50 text-white p-1 rounded-full">
                                <Video className="h-3 w-3" />
                            </div>
                         )}
                         <div className="absolute bottom-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(event.createdAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                         </div>
                       </>
                    )}
                    {event.type === 'moment' && (
                        <div className="aspect-square flex flex-col items-center justify-center bg-secondary rounded-lg p-2 text-center relative group">
                            <Zap className="w-8 h-8 text-secondary-foreground mb-2" />
                            <p className="text-sm font-semibold text-secondary-foreground">Momento</p>
                            <p className="text-xs text-muted-foreground">
                              {event.initiator?.name || 'Utente'}
                            </p>
                            <div className="absolute bottom-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(event.createdAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Lightbox for Images */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
            onClick={() => setSelectedImage(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.img
              key={selectedImage.id}
              src={selectedImage.path}
              alt="Immagine ingrandita"
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white h-10 w-10"
              onClick={() => setSelectedImage(null)}
            >
              <X className="h-6 w-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Modal for Moments */}
      <AnimatePresence>
        {selectedMoment && (
            <motion.div
                className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
                onClick={() => setSelectedMoment(null)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div
                    className="bg-card p-6 rounded-lg max-w-md w-full m-4"
                    onClick={(e) => e.stopPropagation()}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                >
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold">Dettagli Momento</h3>
                        <Button variant="ghost" size="icon" onClick={() => setSelectedMoment(null)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                    <p><strong>Stato:</strong> <span className="capitalize">{selectedMoment.status}</span></p>
                    <p><strong>Iniziato da:</strong> {selectedMoment.initiator?.name || 'Sconosciuto'}</p>
                    {selectedMoment.participant && <p><strong>Partecipante:</strong> {selectedMoment.participant.name || 'Sconosciuto'}</p>}
                    
                    {selectedMoment.images && selectedMoment.images.length > 0 && (
                        <div className="mt-4">
                            <h4 className="font-semibold mb-2">Immagini del momento:</h4>
                            <div className="flex flex-wrap gap-2">
                                {selectedMoment.images.map(img => (
                                    <img key={img.id} src={img.thumbnailPath || img.path} className="w-24 h-24 object-cover rounded-md" alt="Foto del momento" />
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 